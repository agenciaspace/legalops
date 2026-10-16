// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const state=vi.hoisted(()=>({rpc:vi.fn(async()=>({error:null}))}))
vi.mock('@/lib/supabase-admin',()=>({createAdminClient:()=>({rpc:state.rpc})}))
import { POST } from '@/app/api/news/subscribe/route'
import { GET as sync } from '@/app/api/cron/news-subscriptions/route'
import { GET as discover } from '@/app/api/cron/news-discovery/route'
import { sendNewsSubscription } from '@/lib/news-beehiiv'
const request=(body:unknown,origin='https://legalops.news')=>new NextRequest('https://legalops.news/api/news/subscribe',{method:'POST',headers:{origin,'content-type':'application/json','cf-connecting-ip':'192.0.2.99'},body:JSON.stringify(body)})
const valid={email:'reader@example.com',consent:true,audiences:['escritorios'],topics:[]}
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();vi.clearAllMocks()})
it('rejects cross-site and invalid signups before writing',async()=>{
 expect((await POST(request(valid,'https://other.test'))).status).toBe(403)
 expect((await POST(request({...valid,consent:false}))).status).toBe(400)
 expect(state.rpc).not.toHaveBeenCalled()
})
it('records consent independently of provider configuration and never leaks raw network addresses',async()=>{
 vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','test-only-key');vi.stubEnv('BEEHIIV_API_KEY','')
 const response=await POST(request(valid))
 expect(response.status).toBe(202)
 expect((await response.json()).message).toContain('Quando a newsletter abrir')
 expect(state.rpc).toHaveBeenCalledWith('register_news_signup',expect.objectContaining({contact_email:valid.email,selected_audiences:['escritorios'],signup_source:'news',network_key:expect.stringMatching(/^[a-f0-9]{64}$/)}))
 expect(JSON.stringify(state.rpc.mock.calls)).not.toContain('192.0.2.99')
})
it('does not invent a successful signup when durable storage fails or rate limit is reached',async()=>{
 vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','test-only-key')
 state.rpc.mockResolvedValueOnce({error:{message:'NEWS_RATE_LIMIT'}} as never)
 expect((await POST(request(valid))).status).toBe(429)
 state.rpc.mockResolvedValueOnce({error:{message:'unavailable'}} as never)
 expect((await POST(request(valid))).status).toBe(503)
})
it('bounds streamed payloads and ignores honeypots without registering an email',async()=>{
 expect((await POST(request({...valid,extra:'x'.repeat(7000)}))).status).toBe(400)
 expect((await POST(request({...valid,company:'spam'}))).status).toBe(202)
 expect(state.rpc).not.toHaveBeenCalled()
})
it('requires configured cron authorization before external work',async()=>{
 for(const endpoint of [sync,discover]){
  expect((await endpoint(new NextRequest('https://legalops.club/api/cron/news'))).status).toBe(401)
  vi.stubEnv('CRON_SECRET','test-only-secret')
  expect((await endpoint(new NextRequest('https://legalops.club/api/cron/news',{headers:{authorization:'Bearer wrong'}}))).status).toBe(401)
 }
 expect(state.rpc).not.toHaveBeenCalled()
})
it('requests double confirmation and preserves unsubscribed readers',async()=>{
 vi.stubEnv('BEEHIIV_API_KEY','test-only-api');vi.stubEnv('BEEHIIV_PUBLICATION_ID','pub_11111111-1111-1111-1111-111111111111')
 const call=vi.fn(async(_url:string,_options:RequestInit)=>new Response(JSON.stringify({data:{id:'sub_test',status:'validating'}}),{status:200}));vi.stubGlobal('fetch',call)
 expect(await sendNewsSubscription({email:'reader@example.com',audiences:['escritorios'],topics:[],source:'news'})).toEqual({state:'sent_to_provider',subscriptionId:'sub_test'})
 const payload=JSON.parse(call.mock.calls[0][1].body as string)
 expect(payload).toMatchObject({double_opt_override:'on',reactivate_existing:false,send_welcome_email:false})
 expect(payload).not.toHaveProperty('club_access_status')
})
