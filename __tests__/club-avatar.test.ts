// @vitest-environment node
import {beforeEach,expect,it,vi} from 'vitest'
import {NextRequest} from 'next/server'
import {isOwnedAvatarPath,validAvatarJpeg} from '@/lib/club-avatar'
const state=vi.hoisted(()=>({user:null as any,member:null as any,admin:vi.fn()}))
vi.mock('@/lib/supabase-server',()=>({createServerSupabaseClient:async()=>({auth:{getUser:async()=>({data:{user:state.user}})},from:()=>{const q={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:state.member})};return q}})}))
vi.mock('@/lib/supabase-admin',()=>({createAdminClient:state.admin}))
import {POST,DELETE} from '@/app/api/club/avatar/route'
import {GET} from '@/app/api/club/avatar/[id]/route'
const uid='11111111-1717-4717-8717-111111111111'
beforeEach(()=>{vi.clearAllMocks();state.user=null;state.member=null})
it('blocks upload and photo reads for anonymous and inactive users before service access',async()=>{
 const request=()=>new NextRequest('https://legalops.club/api/club/avatar',{method:'POST',body:'image'})
 expect((await POST(request())).status).toBe(401)
 expect((await DELETE()).status).toBe(401)
 expect((await GET(request(),{params:{id:uid}})).status).toBe(401)
 state.user={id:uid};state.member={club_access_status:'inactive'}
 expect((await POST(request())).status).toBe(403)
 expect((await DELETE()).status).toBe(403)
 expect((await GET(request(),{params:{id:uid}})).status).toBe(403)
 expect(state.admin).not.toHaveBeenCalled()
})
it('rejects nonimages, oversized payloads and paths owned by somebody else',async()=>{
 state.user={id:uid};state.member={club_access_status:'active'}
 const request=(headers:any,body:string)=>new NextRequest('https://legalops.club/api/club/avatar',{method:'POST',headers,body})
 expect((await POST(request({'content-type':'image/svg+xml'},'<svg/>'))).status).toBe(415)
 expect((await POST(request({'content-type':'image/jpeg'},'not an image'))).status).toBe(400)
 expect((await POST(request({'content-type':'image/jpeg','content-length':'2000000'},'x'))).status).toBe(413)
 expect(validAvatarJpeg(new Uint8Array([1,2,3]))).toBe(false)
 expect(isOwnedAvatarPath(`${uid}/${uid}.jpg`,uid)).toBe(true)
 expect(isOwnedAvatarPath(`22222222-1717-4717-8717-222222222222/${uid}.jpg`,uid)).toBe(false)
 expect(isOwnedAvatarPath(`${uid}/../../secret.jpg`,uid)).toBe(false)
 expect(state.admin).not.toHaveBeenCalled()
})
