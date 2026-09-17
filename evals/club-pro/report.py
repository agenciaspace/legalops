"""Rebuild the quantitative appendix from captured API responses."""
import json,statistics,math
from pathlib import Path
ROOT=Path(__file__).resolve().parent
rows=json.loads((ROOT/'scored.json').read_text())
metrics=[]
for model in sorted(set(r['requested_model'] for r in rows)):
 group=[r for r in rows if r['requested_model']==model];dur=sorted(r['latency_ms'] for r in group)
 costs=[(r.get('usage') or {}).get('cost') for r in group]
 metrics.append({'model':model,'attempts':len(group),'successful':sum(r['status']==200 for r in group),'measured_cost_usd':sum(c for c in costs if c is not None),'unknown_cost_attempts':sum(c is None for c in costs),'latency_p50_ms':statistics.median(dur),'latency_p95_ms':dur[math.ceil(.95*len(dur))-1],'input_tokens':sum(r['usage']['prompt_tokens'] for r in group),'output_tokens':sum(r['usage']['completion_tokens'] for r in group),'cached_input_tokens':sum(r['usage'].get('prompt_tokens_details',{}).get('cached_tokens',0) for r in group),'reasoning_tokens':sum(r['usage'].get('completion_tokens_details',{}).get('reasoning_tokens',0) for r in group),'semantic_fields_pass':sum(r['semantic_fields_pass'] for r in group)})
# Planning assumptions, NOT observed monthly behavior. Text-only, no cache savings.
fx=6;fee=1.055
unit={
 'standard':{'model':'google/gemini-2.5-flash','input':12000,'output':1400,'in_usd_m':.3,'out_usd_m':2.5},
 'deep':{'model':'anthropic/claude-sonnet-4.6','input':12000,'output':2000,'in_usd_m':3,'out_usd_m':15},
 'digest':{'model':'google/gemini-3.1-flash-lite','input':3000,'output':600,'in_usd_m':.25,'out_usd_m':1.5},
 'letter':{'model':'google/gemini-2.5-flash','input':3000,'output':800,'in_usd_m':.3,'out_usd_m':2.5},
}
for v in unit.values():v['brl']=(v['input']*v['in_usd_m']+v['output']*v['out_usd_m'])/1e6*fx*fee
scenarios=[]
for name,counts in [('Leve',{'standard':60,'deep':4,'digest':30,'letter':4}),('Frequente',{'standard':200,'deep':12,'digest':30,'letter':8}),('Intenso',{'standard':600,'deep':40,'digest':30,'letter':20})]:
 cost=sum(unit[k]['brl']*n for k,n in counts.items())
 scenarios.append({'name':name,'counts':counts,'estimated_llm_brl':round(cost,2),'reserve_2x_brl':round(cost*2,2)})
pilot=json.loads((ROOT/'pilot.json').read_text())['usage']['cost']
output={'metrics':metrics,'benchmark_usd':sum(m['measured_cost_usd'] for m in metrics),'pilot_usd':pilot,'assumptions':{'usd_brl_planning_only':fx,'provider_purchase_fee_multiplier':fee,'monthly_patterns_measured':False,'cache_savings_assumed':False,'unit_tasks':unit},'scenarios':scenarios}
(ROOT/'costs.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
lines=['# Resultados quantitativos','', 'Gerado por `python3 evals/club-pro/report.py` a partir de respostas preservadas.','', '| Modelo | Chamadas OK | Custo medido USD | Mediana | p95 |','|---|---:|---:|---:|---:|']
for m in metrics:lines.append(f"| {m['model']} | {m['successful']}/{m['attempts']} | {m['measured_cost_usd']:.6f} | {m['latency_p50_ms']/1000:.2f}s | {m['latency_p95_ms']/1000:.2f}s |")
lines+=['',f"Total da avaliação: US$ {output['benchmark_usd']:.6f}; piloto separado: US$ {pilot:.6f}.",'','## Planejamento mensal de IA — não é preço de venda','', 'Premissas: dólar de planejamento R$6, taxa de compra 5,5%, texto sem ferramentas pagas, sem desconto de cache. Requisição padrão: 12 mil tokens de entrada / 1.400 saída. Profunda: 12 mil / 2 mil. Boletim: 3 mil / 600. Carta: 3 mil / 800. Não são médias medidas dos membros.','', '| Perfil | Padrão / profundas / boletins / cartas | IA estimada | Reserva 2× |','|---|---|---:|---:|']
for s in scenarios:lines.append(f"| {s['name']} | {' / '.join(str(s['counts'][k]) for k in unit)} | R$ {s['estimated_llm_brl']:.2f} | R$ {s['reserve_2x_brl']:.2f} |")
lines+=['','Reserva 2× é uma hipótese explícita de contingência, não uma margem observada. Exclui aquisição de conteúdo, transcrição, buscas pagas, armazenamento, hospedagem, email, impostos e trabalho operacional. Múltiplas chamadas numa tarefa devem ser somadas. O piso mensal da infraestrutura dividido pelo número de pagantes também precisa entrar na conta.','', 'Fontes de preços: [Flash Lite](https://openrouter.ai/google/gemini-3.1-flash-lite), [Flash](https://openrouter.ai/google/gemini-2.5-flash), [Sonnet](https://openrouter.ai/anthropic/claude-sonnet-4.6), [taxa OpenRouter](https://openrouter.ai/pricing). Custos medidos vêm de `usage.cost`, conforme [Usage Accounting](https://openrouter.ai/docs/cookbook/administration/usage-accounting).']
(ROOT/'costs.md').write_text('\n'.join(lines)+'\n')
print(json.dumps(output,ensure_ascii=False,indent=2))
