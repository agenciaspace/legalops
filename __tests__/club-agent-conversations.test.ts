// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const id='11111111-1111-4111-8111-111111111111'
const state=vi.hoisted(()=>({user:{id:'owner'} as {id:string}|null,pro:true,rpc:vi.fn(),insert:vi.fn(),admin:vi.fn()}))
vi.mock('@/lib/supabase-server',()=>({createServerSupabaseClient:async()=>({auth:{getUser:async()=>({data:{user:state.user}})},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{club_access_status:'active',club_pro_status:state.pro?'active':'inactive'}})})})})})}))
vi.mock('@/lib/supabase-admin',()=>({createAdminClient:()=>{state.admin();return {rpc:state.rpc,from:()=>({insert:state.insert})}}}))
vi.mock('@/lib/openrouter',()=>({generateOpenRouterText:vi.fn()}))
import {POST} from '@/app/api/club/agent/conversations/route'
import {DELETE} from '@/app/api/club/agent/route'
const request=(suffix='')=>new NextRequest('https://legalops.club/api/club/agent'+suffix,{method:'DELETE'})
beforeEach(()=>{vi.clearAllMocks();state.user={id:'owner'};state.pro=true;state.rpc.mockResolvedValue({data:true,error:null});state.insert.mockReturnValue({select:()=>({single:async()=>({data:{id,title:'Nova conversa'},error:null})})})})
it('creates a conversation belonging to the authenticated user',async()=>{
 const response=await POST();expect(response.status).toBe(201)
 expect(state.insert).toHaveBeenCalledWith({user_id:'owner'})
 expect((await response.json()).conversation.id).toBe(id)
})
it('blocks anonymous and non-Pro conversation management',async()=>{
 state.user=null;expect((await POST()).status).toBe(401)
 state.user={id:'owner'};state.pro=false;expect((await DELETE(request('?conversation_id='+id))).status).toBe(403)
 expect(state.admin).not.toHaveBeenCalled()
})
it('requires an explicit id, so legacy delete-all requests cannot erase conversations',async()=>{
 expect((await DELETE(request())).status).toBe(400)
 expect((await DELETE(request('?conversation_id=invalid'))).status).toBe(400)
 expect(state.rpc).not.toHaveBeenCalled()
})
it('deletes only the requested conversation for the authenticated owner',async()=>{
 expect((await DELETE(request('?conversation_id='+id+'&user_id=intruder'))).status).toBe(200)
 expect(state.rpc).toHaveBeenCalledWith('delete_club_agent_conversation',{member_id:'owner',conversation_uuid:id})
})
it('returns 404 for missing or foreign conversations',async()=>{
 state.rpc.mockResolvedValue({data:false,error:null})
 expect((await DELETE(request('?conversation_id='+id))).status).toBe(404)
})
it('rejects deletion while a response is in progress',async()=>{
 state.rpc.mockResolvedValue({error:{message:'QUESTION_IN_PROGRESS'}})
 expect((await DELETE(request('?conversation_id='+id))).status).toBe(409)
})
