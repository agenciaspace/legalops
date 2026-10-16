// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const state=vi.hoisted(()=>({user:{id:'member',email:'member@example.com'} as {id:string;email:string}|null,admin:vi.fn()}))
vi.mock('@/lib/supabase-server',()=>({createServerSupabaseClient:async()=>({auth:{getUser:async()=>({data:{user:state.user}})}})}))
vi.mock('@/lib/supabase-admin',()=>({createAdminClient:state.admin}))
import { GET,POST } from '@/app/api/news/admin/route'
afterEach(()=>{vi.unstubAllEnvs();vi.clearAllMocks();state.user={id:'member',email:'member@example.com'}})
it('does not expose private drafts or subscribers to a normal member',async()=>{
 vi.stubEnv('LEGALOPS_ADMIN_EMAILS','editor@example.com')
 expect((await GET()).status).toBe(403)
 expect((await POST(new NextRequest('https://legalops.club/api/news/admin',{method:'POST',headers:{origin:'https://legalops.club','content-type':'application/json'},body:'{}'}))).status).toBe(403)
 expect(state.admin).not.toHaveBeenCalled()
})
it('requires a signed-in admin and same-origin publication',async()=>{
 vi.stubEnv('LEGALOPS_ADMIN_EMAILS','editor@example.com');state.user=null
 expect((await GET()).status).toBe(403)
 state.user={id:'editor',email:'editor@example.com'}
 expect((await POST(new NextRequest('https://legalops.club/api/news/admin',{method:'POST',headers:{origin:'https://other.test'},body:'{}'}))).status).toBe(403)
 expect(state.admin).not.toHaveBeenCalled()
})
