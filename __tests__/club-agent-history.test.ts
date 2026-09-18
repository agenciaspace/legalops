// @vitest-environment node
import {beforeEach,expect,it,vi} from 'vitest'
import {NextRequest} from 'next/server'
const state=vi.hoisted(()=>({user:{id:'owner'} as any,calls:[] as any[],rows:Array.from({length:31},(_,i)=>({id:String(i),question:'q',answer:'a'}))}))
vi.mock('@/lib/supabase-server',()=>({createServerSupabaseClient:async()=>({auth:{getUser:async()=>({data:{user:state.user}})},from:(table:string)=>{const data=()=>table==='community_members'?{club_access_status:'active',club_pro_status:'active'}:table==='club_agent_turns'?state.rows:table==='club_agent_conversations'?[{id:'11111111-1111-4111-8111-111111111111',title:'Conversa'}]:null;const q:any={};for(const m of ['select','eq','order','range'])q[m]=(...args:any[])=>{state.calls.push([table,m,...args]);return q};q.maybeSingle=async()=>({data:data()});q.then=(resolve:any)=>resolve({data:data()});return q}})}))
vi.mock('@/lib/supabase-admin',()=>({createAdminClient:vi.fn()}))
vi.mock('@/lib/openrouter',()=>({generateOpenRouterText:vi.fn()}))
import {GET} from '@/app/api/club/agent/route'
beforeEach(()=>{state.user={id:'owner'};state.calls=[]})
it('paginates only the authenticated owner history in chronological display order',async()=>{
 const response=await GET(new NextRequest('https://legalops.club/api/club/agent?page=1&user_id=other'));const data=await response.json()
 expect(state.calls).toContainEqual(['club_agent_turns','eq','user_id','owner'])
 expect(state.calls).toContainEqual(['club_agent_turns','range',30,60])
 expect(state.calls).toContainEqual(['club_agent_turns','eq','conversation_id','11111111-1111-4111-8111-111111111111'])
 expect(data.turns).toHaveLength(30);expect(data.has_more).toBe(true);expect(data.turns[0].id).toBe('29')
})
it('rejects anonymous access and malformed page indexes',async()=>{
 expect((await GET(new NextRequest('https://legalops.club/api/club/agent?page=-1'))).status).toBe(400)
 state.user=null;expect((await GET(new NextRequest('https://legalops.club/api/club/agent'))).status).toBe(401)
})
