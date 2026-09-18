#!/usr/bin/env python3
"""One community, one 24h window; SQLite is read-only. No gateway lifecycle calls."""
import argparse
import datetime as dt
import fcntl
import json
import os
from pathlib import Path
import sqlite3
import urllib.request

UTC = dt.timezone.utc
GROUP = '120363427485795268@g.us'
OWNER = '5511947519397'
PREFIX = '*Resumo diário · legalops.club*'
DAY = dt.timedelta(days=1)

def iso(value):
    return value.astimezone(UTC).isoformat().replace('+00:00', 'Z')

def slot(now):
    end = now.astimezone(UTC).replace(hour=21, minute=0, second=0, microsecond=0)
    return end if end <= now else end-DAY

def read_env(path):
    result = {}
    for line in Path(path).read_text().splitlines():
        if '=' in line and not line.lstrip().startswith('#'):
            key, value = line.split('=', 1)
            result[key.strip()] = value.strip().strip('"').strip("'")
    return result

def post(url, body, headers):
    data = json.dumps(body, ensure_ascii=False).encode()
    req = urllib.request.Request(url, data=data, headers={'Content-Type':'application/json','User-Agent':'Mozilla/5.0 LegalOpsSummary/1.0', **headers})
    with urllib.request.urlopen(req, timeout=75) as response:
        return json.load(response)

def collect(db, end):
    rows = db.execute('''select wm_id,ts,sender_jid,text,msg_id from messages
      where chat_jid=? and owner=? and coalesce(deleted,0)=0 and ts>=? and ts<? order by ts,wm_id''',
      (GROUP, OWNER, (end-DAY).timestamp(), end.timestamp())).fetchall()
    messages, authors, seen, omitted = [], {}, set(), 0
    for row_id, timestamp, author, text, message_id in rows:
        identity = message_id or str(row_id)
        if identity in seen: continue
        seen.add(identity)
        if (text or '').startswith(PREFIX): continue
        if not (text or '').strip():
            transcript = db.execute('select transcription from audio_transcriptions where webhook_msg_id=? and status=? order by id desc limit 1',(row_id,'done')).fetchone()
            text = transcript[0] if transcript else ''
        if not (text or '').strip():
            omitted += 1
            continue
        # No silent truncation: retry/log locally if the period exceeds the API budget.
        if len(text) > 12000: raise ValueError('Source message exceeds supported length')
        author = author or OWNER
        authors.setdefault(author, f'Participante {len(authors)+1}')
        messages.append({'id':str(row_id),'at':iso(dt.datetime.fromtimestamp(timestamp,UTC)), 'author':authors[author], 'text':text})
    if len(messages) > 2000: raise ValueError('Period exceeds supported message count')
    return messages, omitted

def render(summary):
    end=dt.datetime.fromisoformat(summary['period_end'].replace('Z','+00:00')).astimezone(dt.timezone(dt.timedelta(hours=-3)))
    start=end-DAY
    points='\n'.join('• '+point for point in summary['key_points'])
    return f"{PREFIX}\n{start:%d/%m %H:%M} a {end:%d/%m %H:%M} (Brasília)\n\n*{summary['title']}*\n{summary['summary']}\n\n{points}\n\n{summary['source_message_count']} mensagens · Síntese por IA\nPróxima edição: amanhã, a partir das 18h, se houver novas mensagens.\nhttps://legalops.club/community/summaries"

def save(path, state):
    temporary=path.with_suffix('.tmp')
    temporary.write_text(json.dumps(state,ensure_ascii=False))
    temporary.chmod(0o600)
    temporary.replace(path)

def run(config, preview=False):
    now=dt.datetime.now(UTC)
    end=now.replace(microsecond=0) if preview else slot(now)
    if not preview and end < dt.datetime.fromisoformat(config['FIRST_RUN_AT'].replace('Z','+00:00')):
        print('Waiting for first scheduled period'); return
    state_dir=Path(config['STATE_DIR']);state_dir.mkdir(parents=True,exist_ok=True,mode=0o700)
    with (state_dir/'runner.lock').open('w') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX | fcntl.LOCK_NB)
        db=sqlite3.connect(f"file:{config['DATABASE']}?mode=ro",uri=True)
        headers={'Authorization':'Bearer '+config['INGEST_SECRET']}
        endpoint=config['APP_URL'].rstrip('/')+'/api/cron/whatsapp-summary'
        state_path=state_dir/(end.strftime('%Y%m%dT%H%M%S')+'.json')
        state=json.loads(state_path.read_text()) if state_path.exists() else {}
        if not preview and state.get('status') in ('done','empty'):
            print('Period already completed');return
        # A timeout after sending is ambiguous. Reconcile with the existing inbound mirror;
        # never blindly resend a message whose outcome is unknown.
        if not preview and state.get('status') == 'sending':
            match=db.execute('select msg_id from messages where chat_jid=? and owner=? and from_me=1 and text=? and ts>=? limit 1', (GROUP,OWNER,state['text'],end.timestamp())).fetchone()
            if not match: raise RuntimeError('Delivery outcome unknown; awaiting mirror confirmation')
            state.update(status='sent',message_id=match[0]);save(state_path,state)
        if not preview and state.get('status') == 'sent':
            post(endpoint,{'action':'delivered','id':state['summary_id']},headers)
            state['status']='done';save(state_path,state);print('Delivery recorded');return
        messages,omitted=collect(db,end)
        result=post(endpoint,{'source':'legalops-community','action':'preview' if preview else 'publish','period_start':iso(end-DAY),'period_end':iso(end),'messages':messages,'omitted_media_count':omitted},headers)
        if not result.get('ok'): raise RuntimeError('Summary service rejected request')
        if preview:
            print(json.dumps({'preview':True,'messages':len(messages),'omitted_media':omitted,'generated':bool(result.get('summary')),'empty':result.get('empty',False)},ensure_ascii=False));return
        if result.get('empty'):
            save(state_path,{'status':'empty'});print('Empty period; no group message');return
        summary=result['summary']
        if summary.get('whatsapp_sent_at'):
            save(state_path,{'status':'done','summary_id':summary['id']});print('Delivery already recorded');return
        text=render(summary)
        hermes=read_env(config['INSTANCE_ENV'])
        base=hermes['UAZAPI_BASE_URL'].rstrip('/')
        if not base.startswith('https://'): raise ValueError('Instance URL must use HTTPS')
        req=urllib.request.Request(base+'/instance/status',headers={'token':hermes['UAZAPI_TOKEN'],'User-Agent':'Mozilla/5.0'})
        with urllib.request.urlopen(req,timeout=20) as response: connection=json.load(response)
        if str(connection.get('instance',{}).get('owner')) != OWNER or not connection.get('status',{}).get('connected'):
            raise RuntimeError('Expected personal instance is not connected')
        state={'status':'sending','summary_id':summary['id'],'text':text};save(state_path,state)
        delivery=post(base+'/send/text',{'number':GROUP,'text':text},{'token':hermes['UAZAPI_TOKEN']})
        if not isinstance(delivery,dict) or delivery.get('error') or delivery.get('success') is False:
            raise RuntimeError('Instance did not confirm delivery')
        state.update(status='sent',message_id=delivery.get('id') or delivery.get('messageid'));save(state_path,state)
        post(endpoint,{'action':'delivered','id':summary['id']},headers)
        state['status']='done';save(state_path,state);print('Summary published and delivered')

if __name__ == '__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--config',default='/root/.config/legalops-whatsapp-summary.env');parser.add_argument('--preview',action='store_true');args=parser.parse_args()
    try: run(read_env(args.config),args.preview)
    except Exception as error:
        # Avoid provider bodies and source messages in logs.
        print('Summary run failed: '+type(error).__name__)
        raise SystemExit(1)
