// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({
  user: {id:'member'} as {id:string}|null, active: true, authorized: true,
  lookups: [] as any[], insertError: null as any,
  upload: vi.fn(), remove: vi.fn(), insert: vi.fn(),
}))
vi.mock('@/lib/community', () => ({ hasActiveClubAccess: () => mocks.active }))
vi.mock('@/lib/supabase-server', () => ({ createServerSupabaseClient: async () => ({
  auth: { getUser: async () => ({data:{user:mocks.user}}) },
  from: (table:string) => {
    const chain:any = {select:()=>chain,eq:()=>chain,maybeSingle:async()=>({data: table === 'community_members' || table === 'community_events' || mocks.authorized ? {id:'allowed'} : null})}
    return chain
  },
}) }))
vi.mock('@/lib/supabase-admin', () => ({createAdminClient: () => ({
  storage: {from:()=>({upload:mocks.upload,remove:mocks.remove})},
  from:()=>{
    const chain:any = {select:()=>chain,eq:()=>chain,is:()=>chain,maybeSingle:async()=>mocks.lookups.shift() ?? {data:null,error:null},insert:(value:any)=>{mocks.insert(value);return chain},single:async()=>({data:{id:'created',publication_id:'batch'},error:mocks.insertError})}
    return chain
  },
})}))
import { POST } from '@/app/api/community/events/upload/route'
const request = (content='%PDF-1.7 content') => {
  const form = new FormData()
  form.set('event_id','42499cb1-fd6f-4b45-aeac-9d10eea4c94d')
  form.set('publication_id','b771501d-2a60-469a-8dbd-29646275811f')
  form.set('file',new File([content],'file.pdf',{type:'application/pdf'}))
  return new Request('https://legalops.club/api/community/events/upload',{method:'POST',headers:{origin:'https://legalops.club'},body:form})
}
beforeEach(()=>{vi.clearAllMocks();mocks.user={id:'member'};mocks.active=true;mocks.authorized=true;mocks.lookups=[];mocks.insertError=null;mocks.upload.mockResolvedValue({error:null});mocks.remove.mockResolvedValue({error:null})})
it('rejects anonymous, inactive and non-participant uploads before storage',async()=>{
  mocks.user=null;expect((await POST(request())).status).toBe(401)
  mocks.user={id:'member'};mocks.active=false;expect((await POST(request())).status).toBe(403)
  mocks.active=true;mocks.authorized=false;expect((await POST(request())).status).toBe(403)
  expect(mocks.upload).not.toHaveBeenCalled()
})
it('rejects cross-origin submissions and mismatched file signatures',async()=>{
  const cross=request();cross.headers.set('origin','https://other.example')
  expect((await POST(cross)).status).toBe(403)
  expect((await POST(request('<html>fake file'))).status).toBe(400)
  expect(mocks.upload).not.toHaveBeenCalled()
})
it('publishes one verified file with a group and a content fingerprint',async()=>{
  expect((await POST(request())).status).toBe(201)
  expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({publication_id:'b771501d-2a60-469a-8dbd-29646275811f',uploader_id:'member',kind:'documento',content_hash:expect.stringMatching(/^[a-f0-9]{64}$/)}))
})
it('returns existing file for an uncertain retry without uploading again',async()=>{
  mocks.lookups=[{data:{id:'existing',publication_id:'batch'},error:null}]
  expect(await (await POST(request())).json()).toMatchObject({id:'existing',duplicate:true})
  expect(mocks.upload).not.toHaveBeenCalled()
})
it('resolves a concurrent duplicate after the unique constraint wins',async()=>{
  mocks.lookups=[{data:null},{data:{id:'winner',publication_id:'batch'}}]
  mocks.insertError={code:'23505'}
  expect(await (await POST(request())).json()).toMatchObject({id:'winner',duplicate:true})
  expect(mocks.remove).toHaveBeenCalledTimes(1)
})
it('cleans only this failed upload and reports errors without removing prior files',async()=>{
  mocks.insertError={code:'500'}
  const response=await POST(request())
  expect(response.status).toBe(503)
  expect(mocks.remove.mock.calls[0][0]).toHaveLength(1)
  expect((await response.json()).error).toContain('não foi publicado')
})
it('does not create a post when storage fails',async()=>{
  mocks.upload.mockResolvedValue({error:{message:'unavailable'}})
  expect((await POST(request())).status).toBe(503)
  expect(mocks.insert).not.toHaveBeenCalled()
})
