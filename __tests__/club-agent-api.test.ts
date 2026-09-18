// @vitest-environment node
import {beforeEach,expect,it,vi} from 'vitest'
import {NextRequest} from 'next/server'
const state=vi.hoisted(()=>({user:{id:'owner'} as {id:string}|null,pro:true,rpc:vi.fn(),generate:vi.fn(),admin:vi.fn(),filters:[] as string[][]}))
vi.mock('@/lib/supabase-server',()=>({createServerSupabaseClient:async()=>({
 auth:{getUser:async()=>({data:{user:state.user}})},
 from:(table:string)=>{
  const data=()=>table==='community_members'?{club_access_status:'active',club_pro_status:state.pro?'active':'inactive'}:table==='account_profiles'?{full_name:'Owner',areas_of_expertise:[]}:table==='club_agent_preferences'?{focus:'Meus contratos',topics:[]}:[]
  const query:any={select:()=>query,eq:(field:string,value:string)=>{state.filters.push([table,field,value]);return query},gte:()=>query,order:()=>query,not:()=>query,limit:()=>query,maybeSingle:async()=>({data:data(),error:null}),then:(resolve:(value:unknown)=>unknown)=>resolve({data:data(),error:null})}
  return query
 },
})}))
vi.mock('@/lib/supabase-admin',()=>({createAdminClient:()=>{state.admin();return {rpc:state.rpc}}}))
vi.mock('@/lib/openrouter',()=>({generateOpenRouterText:state.generate}))
import {POST} from '@/app/api/club/agent/route'
const request=(body:unknown)=>new NextRequest('https://legalops.club/api/club/agent',{method:'POST',body:JSON.stringify(body)})
beforeEach(()=>{vi.clearAllMocks();state.user={id:'owner'};state.pro=true;state.filters=[];state.rpc.mockImplementation(async(name:string)=>name==='reserve_club_agent_turn'?{data:'turn',error:null}:{error:null});state.generate.mockResolvedValue('Veja o OpenCLM [1].')})
it('blocks anonymous and free accounts before service-role or model calls',async()=>{
 state.user=null;expect((await POST(request({question:'OpenCLM?'}))).status).toBe(401)
 state.user={id:'owner'};state.pro=false;expect((await POST(request({question:'OpenCLM?'}))).status).toBe(403)
 expect(state.admin).not.toHaveBeenCalled();expect(state.generate).not.toHaveBeenCalled()
})
it('uses the authenticated owner, ignoring a forged user id',async()=>{
 const response=await POST(request({question:'Como usar o OpenCLM?',user_id:'another-person'}))
 expect(response.status).toBe(200)
 expect(state.rpc).toHaveBeenCalledWith('reserve_club_agent_turn',{member_id:'owner',question_text:'Como usar o OpenCLM?'})
 expect(state.filters.filter(([,field])=>field==='user_id').every(([, ,id])=>id==='owner')).toBe(true)
 const body=await response.json();expect(body.turn.sources).toContainEqual(expect.objectContaining({url:'https://legalops.dev/openclm'}))
})
it('enforces daily allowance before invoking the model',async()=>{
 state.rpc.mockResolvedValue({error:{message:'DAILY_LIMIT'}})
 expect((await POST(request({question:'Outra pergunta'}))).status).toBe(429)
 expect(state.generate).not.toHaveBeenCalled()
})
it('uses the saved language preference for the agent response',async()=>{
 const req=new NextRequest('https://legalops.club/api/club/agent',{method:'POST',headers:{cookie:'club-locale=en'},body:JSON.stringify({question:'What should I follow?'})})
 expect((await POST(req)).status).toBe(200)
 expect(state.generate.mock.calls[0][0].systemPrompt).toContain('Respond in English.')
})
it('records failure and refunds the reservation instead of saving an invented answer',async()=>{
 state.generate.mockRejectedValue(new Error('provider down'))
 const log=vi.spyOn(console,'error').mockImplementation(()=>{})
 expect((await POST(request({question:'Como usar o OpenCLM?'}))).status).toBe(503)
 expect(state.rpc).toHaveBeenCalledWith('finish_club_agent_turn',{turn_id:'turn',answer_text:null,source_links:[],failed:true})
 log.mockRestore()
})
it('grounds personalized digests in the owner interactions and published events',async()=>{
 await POST(request({question:'Resuma minhas interações e recomende Bench',page:'/community/calendar',user_id:'intruder'}))
 expect(state.filters).toContainEqual(['community_comments','author_id','owner'])
 expect(state.filters).toContainEqual(['community_post_likes','user_id','owner'])
 expect(state.filters).toContainEqual(['community_posts','author_id','owner'])
 expect(state.filters).toContainEqual(['community_events','is_published',true])
 const prompt=state.generate.mock.calls[0][0];expect(prompt.userPrompt).toContain('/community/calendar');expect(prompt.userPrompt).toContain('Não há rastreamento de páginas lidas')
 expect(prompt.systemPrompt).toContain('Não afirme que sabe o que foi lido')
})
