#!/usr/bin/env python3
"""Read the existing WhatsApp mirror; persist a private, retryable URL queue."""
import argparse
import collections
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import sqlite3
import time
import urllib.parse
import urllib.request

HOSTS = ('linkedin.com', 'lnkd.in', 'gupy.io', 'greenhouse.io', 'lever.co', 'workable.com', 'myworkdayjobs.com', 'jobs.ashbyhq.com', 'pandape.info', 'solides.com.br', 'inhire.app', 'lg.com.br')
JOB = re.compile(r'\b(vaga|vagas|contratando|hiring|oportunidade|recrutamento|currículo|curriculo|candidatura)\b', re.I)

def read_env(path):
    result = {}
    for line in Path(path).read_text().splitlines():
        if '=' in line and not line.lstrip().startswith('#'):
            key, value = line.split('=', 1)
            result[key.strip()] = value.strip().strip('"').strip("'")
    return result

def canonical_url(value):
    parts = urllib.parse.urlsplit(value.rstrip('.,;:!?)*]>'))
    if parts.scheme not in ('http', 'https') or not parts.hostname or parts.username or parts.password:
        return None
    host = parts.hostname.lower()
    match = re.search(r'/jobs/view/(?:.*-)?(\d{6,})/?$', parts.path)
    if (host == 'linkedin.com' or host.endswith('.linkedin.com')) and match:
        return 'https://www.linkedin.com/jobs/view/' + match[1]
    query = [(k, v) for k, v in urllib.parse.parse_qsl(parts.query) if not k.lower().startswith('utm_') and k.lower() not in ('trk', 'trackingid', 'refid', 'source', 'ref')]
    return urllib.parse.urlunsplit((parts.scheme, parts.netloc.lower(), parts.path.rstrip('/') or '/', urllib.parse.urlencode(sorted(query)), ''))

def candidates(text):
    result = []
    for raw in re.findall(r'https?://[^\s<>"\u200b]+', text or ''):
        try:
            url = canonical_url(raw)
            if not url: continue
            host = urllib.parse.urlsplit(url).hostname
            known = any(host == domain or host.endswith('.' + domain) for domain in HOSTS)
            if known or JOB.search(text): result.append(url)
        except ValueError:
            continue
    return list(dict.fromkeys(result))

def init_queue(db):
    db.executescript('''
      create table if not exists items (
        key text primary key, url text, status text not null, reason text,
        attempts integer not null default 0, next_attempt real not null default 0,
        first_seen real not null, updated_at real not null, job_id text);
      create table if not exists sources (
        item_key text not null, group_jid text not null, wm_id integer not null,
        message_at real not null, primary key(item_key,group_jid,wm_id));
    ''')

def collect(source, queue, groups, owner, now):
    count = 0
    for group in groups:
        rows = source.execute('''select wm_id,ts,text,msg_type from messages
          where chat_jid=? and owner=? and coalesce(deleted,0)=0 and ts>=? and ts<=?
          order by ts,wm_id''', (group, owner, now-30*86400, now)).fetchall()
        for message_id, timestamp, text, kind in rows:
            urls = candidates(text or '')
            reason = None
            if not urls:
                if JOB.search(text or ''): reason = 'no_application_link'
                elif kind in ('ImageMessage', 'DocumentMessage'): reason = 'media_requires_review'
                else: continue
            for url in urls or [None]:
                key = hashlib.sha256((url or f'{group}:{message_id}:{text}').encode()).hexdigest()
                status = 'queued' if url else 'pending'
                cursor = queue.execute('insert or ignore into items(key,url,status,reason,first_seen,updated_at) values(?,?,?,?,?,?)', (key,url,status,reason,now,now))
                count += cursor.rowcount
                queue.execute('insert or ignore into sources values(?,?,?,?)', (key,group,message_id,timestamp))
    queue.commit()
    return count

def post(config, url):
    request = urllib.request.Request(config['APP_URL'].rstrip('/')+'/api/cron/whatsapp-jobs',
        data=json.dumps({'url':url}).encode(), headers={
            'Content-Type':'application/json', 'User-Agent':'LegalOpsCLOC/1.0',
            'Authorization':'Bearer '+config['INGEST_SECRET']})
    with urllib.request.urlopen(request, timeout=180) as response:
        return json.load(response)

def process(queue, config, limit=12, send=post):
    counts = collections.Counter()
    rows = queue.execute("select key,url,attempts from items where status in ('queued','retry') and next_attempt<=? order by next_attempt,first_seen limit ?", (time.time(),limit)).fetchall()
    for key,url,attempts in rows:
        try:
            result = send(config, url)
            status = result.get('status')
            if status not in ('published','duplicate','pending','closed','retry'): raise ValueError('Invalid status')
        except Exception:
            result = {'reason':'request_failed'}
            status = 'retry'
        now = time.time()
        delay = min(86400, 300 * 2**min(attempts,9)) if status == 'retry' else 0
        queue.execute('update items set status=?,reason=?,attempts=attempts+1,next_attempt=?,updated_at=?,job_id=? where key=?',
            (status,result.get('reason'),now+delay,now,result.get('job_id'),key))
        queue.commit()
        counts[status] += 1
    return dict(counts)

def run(args):
    os.umask(0o077)
    state = Path(args.state_dir)
    state.mkdir(parents=True,exist_ok=True,mode=0o700)
    with (state/'runner.lock').open('w') as lock:
        try: fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError: return
        groups = [g['jid'] for g in json.loads(Path(args.groups).read_text())['groups'] if 'cloc' in g.get('name','').lower()]
        if not groups: raise ValueError('No CLOC groups configured')
        config = read_env(args.config)
        with sqlite3.connect(f'file:{args.source}?mode=ro', uri=True, timeout=20) as source, sqlite3.connect(state/'queue.db') as queue:
            init_queue(queue)
            added = collect(source,queue,groups,args.owner,time.time())
            processed = {} if args.collect_only else process(queue,config,args.limit)
            totals = dict(queue.execute('select status,count(*) from items group by status').fetchall())
            report = {'checked_at':time.time(),'groups':len(groups),'added':added,'processed':processed,'totals':totals}
            (state/'status.json.tmp').write_text(json.dumps(report,indent=2)+'\n')
            (state/'status.json.tmp').replace(state/'status.json')
            print(json.dumps(report))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--config',default='/root/.config/legalops-whatsapp-summary.env')
    parser.add_argument('--source',default='/root/.hermes/5511947519397.db')
    parser.add_argument('--owner',default='5511947519397')
    parser.add_argument('--groups',default='/root/.hermes/uazapi_summary_groups.json')
    parser.add_argument('--state-dir',default='/var/lib/legalops-cloc-jobs')
    parser.add_argument('--limit',type=int,default=12)
    parser.add_argument('--collect-only',action='store_true')
    try: run(parser.parse_args())
    except Exception as error:
        print('CLOC job import failed: '+type(error).__name__)
        raise SystemExit(1)
