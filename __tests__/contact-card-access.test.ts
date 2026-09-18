// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest'
const state=vi.hoisted(()=>({user:null as any, viewer:null as any, target:null as any, details:null as any}))
function builder(data:unknown){const chain:any={select:()=>chain,eq:()=>chain,maybeSingle:async()=>({data,error:null})};return chain}
vi.mock('@/lib/supabase-server',()=>({createServerSupabaseClient:async()=>({auth:{getUser:async()=>({data:{user:state.user}})},from:()=>builder(state.viewer)})}))
vi.mock('@/lib/supabase-admin',()=>({createAdminClient:()=>({from:(table:string)=>builder(table==='community_members'?state.target:state.details)})}))
import { readContactCard } from '@/lib/contact-card-server'
import { GET as download } from '@/app/contact/[id]/vcard/route'
import { GET as qr } from '@/app/contact/[id]/qr/route'
const id='42499cb1-fd6f-4b45-aeac-9d10eea4c94d'
beforeEach(()=>{state.user=null;state.viewer=null;state.target={user_id:id,display_name:'Ana',current_role:'Legal Ops',organization_name:'Empresa',linkedin_url:'https://linkedin.com/in/ana',club_access_status:'complimentary',club_access_expires_at:null,private_bio:'DO NOT SHARE',auth_email:'login@secret.test'};state.details={email:'chosen@example.com',phone:null,website:null,public_enabled:false}})
it('does not reveal any identity or contacts to guests unless enabled by the owner',async()=>{
  expect(await readContactCard(id)).toMatchObject({status:403,card:null})
  state.details=null
  expect(await readContactCard(id)).toMatchObject({status:403,card:null})
})
it('projects only approved fields for a public card',async()=>{
  state.details.public_enabled=true
  const result=await readContactCard(id)
  expect(result.status).toBe(200)
  expect(result.card?.email).toBe('chosen@example.com')
  expect(JSON.stringify(result.card)).not.toMatch(/DO NOT SHARE|login@secret/)
})
it('permits active members but not an inactive signed-in account to read a private card',async()=>{
  state.user={id:'viewer'};state.viewer={club_access_status:'inactive'}
  expect((await readContactCard(id)).status).toBe(403)
  state.viewer={club_access_status:'complimentary',club_access_expires_at:null}
  expect((await readContactCard(id)).status).toBe(200)
})
it('hides cards belonging to expired memberships even when sharing was enabled',async()=>{
  state.details.public_enabled=true;state.target.club_access_expires_at='2020-01-01'
  expect((await readContactCard(id)).status).toBe(404)
})
it('enforces the same permissions for vCard downloads and prevents caching',async()=>{
  const request=new Request(`https://legalops.club/contact/${id}/vcard`)
  expect((await download(request,{params:{id}})).status).toBe(403)
  state.details.public_enabled=true
  const response=await download(request,{params:{id}})
  expect(response.status).toBe(200)
  expect(response.headers.get('cache-control')).toContain('no-store')
  expect(response.headers.get('content-disposition')).toContain('.vcf')
  expect(await response.text()).toContain('EMAIL;TYPE=INTERNET:chosen@example.com')
})
it('generates a downloadable QR without embedding phone or email data',async()=>{
  const response=await qr(new Request(`https://legalops.club/contact/${id}/qr?download=1`),{params:{id}})
  expect(response.headers.get('content-type')).toBe('image/svg+xml')
  expect(response.headers.get('content-disposition')).toContain('attachment')
  expect(await response.text()).toContain('<svg')
  expect((await qr(new Request('https://legalops.club/contact/invalid/qr'),{params:{id:'invalid'}})).status).toBe(404)
})
