"""Bounded, resumable synthetic evaluation. Credentials are read from private files."""
import concurrent.futures,json,subprocess,time,threading
from pathlib import Path
ROOT=Path(__file__).resolve().parent
CASES=json.loads((ROOT/'cases.json').read_text())
MODELS=['google/gemini-3.1-flash-lite','google/gemini-2.5-flash','anthropic/claude-sonnet-4.6']
RESULTS=ROOT/'results';RESULTS.mkdir(exist_ok=True)
URL=Path('/tmp/legalops-eval-url').read_text().strip()
TOKEN=Path('/tmp/legalops-eval-token').read_text().strip()
lock=threading.Lock();cost=0

def run_model(model):
 global cost
 for repeat in (1,2):
  prior={}
  for case in CASES:
   path=RESULTS/f"{model.split('/')[-1]}-{repeat}-{case['id']}.json"
   if path.exists():
    row=json.loads(path.read_text());prior[case['id']]=row;continue
   with lock:
    if cost>2:raise RuntimeError('Evaluation spend stop: USD 2 measured plus in-flight requests')
   payload={'case':case['id'],'model':model,'repeat':repeat}
   parent=prior.get(case.get('depends_on'))
   if case.get('depends_on') and (not parent or not parent.get('answer')):
    row={'case':case['id'],'requested_model':model,'status':424,'error':{'message':'Previous stage failed'},'answer':None,'usage':None,'latency_ms':0}
   else:
    if parent:payload['previous']=parent['answer']
    config=f'url = "{URL}"\nheader = "Authorization: Bearer {TOKEN}"\nheader = "Content-Type: application/json"\n'
    start=time.monotonic()
    r=subprocess.run(['curl','-sS','--max-time','50','-K','-','--data-binary',json.dumps(payload)],input=config,capture_output=True,text=True)
    try:row=json.loads(r.stdout)
    except json.JSONDecodeError:row={'case':case['id'],'requested_model':model,'status':502,'error':{'message':'Preview transport failed'},'answer':None,'usage':None,'latency_ms':(time.monotonic()-start)*1000}
    row['client_latency_ms']=round((time.monotonic()-start)*1000)
   row['repeat']=repeat;row['stage']=case['stage'];row['timestamp_utc']=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())
   path.write_text(json.dumps(row,ensure_ascii=False,indent=2)+'\n');prior[case['id']]=row
   with lock:
    cost+=(row.get('usage') or {}).get('cost') or 0
    print(model,repeat,case['id'],row['status'],'USD',round(cost,6),flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 for future in concurrent.futures.as_completed([pool.submit(run_model,m) for m in MODELS]):future.result()
print('Finished. New measured USD:',cost)
