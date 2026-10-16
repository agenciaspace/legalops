// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const state=vi.hoisted(()=>({user:{id:'owner'} as {id:string}|null,member:{club_access_status:'active',club_access_expires_at:null},upsert:vi.fn(async()=>({error:null})),eq:vi.fn()}))
vi.mock('@/lib/supabase-server',()=>({createServerSupabaseClient:async()=>({auth:{getUser:async()=>({data:{user:state.user}})},from:(table:string)=>{const q={select:()=>q,eq:(...args:unknown[])=>{state.eq(...args);return q},maybeSingle:async()=>({data:table==='community_members'?state.member:null,error:null}),upsert:state.upsert};return q}})}))
import { GET, PUT } from '@/app/api/club/news/preferences/route'
const request=(body:unknown)=>new NextRequest('https://legalops.club/api/club/news/preferences',{method:'PUT',headers:{origin:'https://legalops.club','content-type':'application/json'},body:JSON.stringify(body)})
afterEach(()=>{vi.clearAllMocks();state.user={id:'owner'};state.member={club_access_status:'active',club_access_expires_at:null}})
it('returns an explicit disabled default and uses only the session owner',async()=>{
 expect(await (await GET()).json()).toEqual({preferences:{enabled:false,audiences:[],topics:[]}})
 expect(state.eq).toHaveBeenCalledWith('user_id','owner')
})
it('allows free members to opt in and ignores caller-supplied ownership',async()=>{
 const response=await PUT(request({user_id:'someone-else',enabled:true,audiences:['escritorios'],topics:['governanca']}))
 expect(response.status).toBe(200)
 expect(state.upsert).toHaveBeenCalledWith(expect.objectContaining({user_id:'owner',enabled:true,audiences:['escritorios']}),{onConflict:'user_id'})
})
it('rejects anonymous, inactive and invalid writes',async()=>{
 state.user=null;expect((await PUT(request({}))).status).toBe(401)
 state.user={id:'owner'};state.member.club_access_status='inactive';expect((await PUT(request({}))).status).toBe(403)
 state.member.club_access_status='active';expect((await PUT(request({enabled:true,audiences:['admin'],topics:[]}))).status).toBe(400)
 expect(state.upsert).not.toHaveBeenCalled()
})
