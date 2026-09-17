// Evaluation preview only. Never deploy this entrypoint to production traffic.
import cases from './cases.json'
const models = ['google/gemini-3.1-flash-lite', 'google/gemini-2.5-flash', 'anthropic/claude-sonnet-4.6']
export default {
  async fetch(request, env) {
    const token = (request.headers.get('authorization') ?? '').replace(/^Bearer /, '')
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))).map(v=>v.toString(16).padStart(2,'0')).join('')
    if (Date.now() > Number(env.EVAL_EXPIRES_AT) || !env.EVAL_TOKEN_SHA256 || digest !== env.EVAL_TOKEN_SHA256) return new Response('Not found', {status:404})
    if (request.method !== 'POST') return new Response('Method not allowed', {status:405})
    const body = await request.json().catch(()=>null)
    const test = cases.find(c=>c.id === body?.case)
    if (!test || !models.includes(body?.model) || ![1,2].includes(body?.repeat) || (body?.previous?.length ?? 0)>16000) return new Response('Invalid evaluation case', {status:400})
    if (test.depends_on && typeof body.previous !== 'string') return new Response('Missing previous stage', {status:400})
    const start = Date.now()
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method:'POST', headers:{Authorization:`Bearer ${env.OPENROUTER_API_KEY}`,'Content-Type':'application/json','HTTP-Referer':'https://legalops.club','X-OpenRouter-Title':'legalops-evaluation'},
        body:JSON.stringify({model:body.model,temperature:0,max_tokens:1400,provider:{data_collection:'deny',zdr:true},messages:[{role:'system',content:test.system},{role:'user',content:test.prompt.replace('{{previous}}',body.previous??'')}]}),
        signal:AbortSignal.timeout(35000),
      })
      const data=await response.json()
      return Response.json({case:test.id,requested_model:body.model,model:data.model,provider:data.provider,id:data.id,status:response.status,latency_ms:Date.now()-start,usage:data.usage??null,finish_reason:data.choices?.[0]?.finish_reason,answer:data.choices?.[0]?.message?.content??null,error:response.ok?null:{code:data.error?.code,message:String(data.error?.message??'Provider error').slice(0,300)}}, {headers:{'Cache-Control':'no-store'}})
    } catch(error) {
      return Response.json({case:test.id,requested_model:body.model,status:503,latency_ms:Date.now()-start,usage:null,answer:null,error:{message:error.name??'Request failed'}},{headers:{'Cache-Control':'no-store'}})
    }
  }
}
