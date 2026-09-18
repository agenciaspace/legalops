// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const state = vi.hoisted(() => ({ user: { id: 'owner' } as {id:string}|null, update: vi.fn(), eq: vi.fn(), initialize: vi.fn(), metadata: vi.fn(async () => ({ error: null })) }))
vi.mock('@/lib/supabase-server',()=>({ createServerSupabaseClient:async()=>({ auth:{getUser:async()=>({data:{user:state.user}}),updateUser:state.metadata},from:()=>{const q:any={update:(value:any)=>{state.update(value);return q},eq:(...args:any[])=>{state.eq(...args);return q},is:(...args:any[])=>{state.initialize(...args);return q},select:async()=>({data:[{user_id:'owner'}],error:null})};return q} }) }))
import { POST } from '@/app/api/account/preferences/route'
const request=(body:unknown)=>new NextRequest('https://legalops.club/api/account/preferences',{method:'POST',body:JSON.stringify(body)})
afterEach(()=>{vi.clearAllMocks();state.user={id:'owner'}})
it('requires authentication and validates preferences',async()=>{
 state.user=null
 expect((await POST(request({locale:'en'}))).status).toBe(401)
 for(const body of [{locale:'fr'},{locale:'en',timezone:'Mars/Crater'},{locale:'es',country:'USA'}])expect((await POST(request(body))).status).toBe(400)
 expect(state.update).not.toHaveBeenCalled()
})
it('writes only the authenticated owner and persists email language metadata',async()=>{
 const response=await POST(request({locale:'es',country:'mx',timezone:'America/Mexico_City',user_id:'someone-else'}))
 expect(response.status).toBe(200)
 expect(state.eq).toHaveBeenCalledWith('user_id','owner')
 expect(state.update).toHaveBeenCalledWith({preferred_locale:'es',country_code:'MX',timezone:'America/Mexico_City'})
 expect(state.metadata).toHaveBeenCalledWith({data:{locale:'es'}})
 expect(response.cookies.get('club-locale')?.value).toBe('es')
})
it('initializes only profiles without a stored language',async()=>{
 await POST(request({locale:'en',initialize:true}))
 expect(state.initialize).toHaveBeenCalledWith('preferred_locale',null)
})
