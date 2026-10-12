// @vitest-environment node
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {NextRequest} from 'next/server'
const state=vi.hoisted(()=>({rpc:vi.fn(),send:vi.fn(),updates:[] as any[],subscription:{state:'trial',next_charge_at:'2099-01-01T00:00:00Z'} as any,member:{club_access_status:'active',club_pro_status:'active',club_pro_expires_at:'2099-01-01T00:00:00Z'} as any}))
vi.mock('@/lib/supabase-admin',()=>({createAdminClient:()=>({rpc:state.rpc,auth:{admin:{getUserById:async()=>({data:{user:{email:'member@example.invalid'}}})}},from:(table:string)=>{const q:any={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:table==='club_pro_subscriptions'?state.subscription:table==='community_members'?state.member:{preferred_locale:'pt-BR'}}),update:(data:any)=>{state.updates.push([table,data]);return q},then:(resolve:any)=>resolve({error:null})};return q}})}))
vi.mock('@/lib/club-email-delivery',()=>({sendClubTransactionalEmail:state.send}))
import {deliverProNotices,buildProNotice} from '@/lib/club-pro-notices'
import {GET} from '@/app/api/cron/club-pro-notices/route'
beforeEach(()=>{vi.clearAllMocks();state.updates=[];state.subscription={state:'trial',next_charge_at:'2099-01-01T00:00:00Z'};state.member={club_access_status:'active',club_pro_status:'active',club_pro_expires_at:'2099-01-01T00:00:00Z'};state.rpc.mockResolvedValue({data:[{id:'notice',user_id:'owner',kind:'activation',access_expires_at:'2099-01-01T00:00:00Z'}]});state.send.mockResolvedValue({messageId:'delivered'})})
afterEach(()=>{vi.unstubAllEnvs()})
it('requires the configured cron bearer before any queue access',async()=>{
 vi.stubEnv('CRON_SECRET','cron-test')
 expect((await GET(new NextRequest('https://legalops.club/api/cron/club-pro-notices'))).status).toBe(401)
 expect((await GET(new NextRequest('https://legalops.club/api/cron/club-pro-notices',{headers:{authorization:'Bearer wrong'}}))).status).toBe(401)
 expect(state.rpc).not.toHaveBeenCalled()
})
it('delivers claimed notices once and records the provider message',async()=>{
 expect(await deliverProNotices()).toMatchObject({sent:1,failed:0})
 expect(state.send).toHaveBeenCalledWith(expect.objectContaining({to:['member@example.invalid'],idempotencyKey:'club-pro/notice',subject:'Seu teste do Pro está pronto | legalops.club'}))
 expect(state.updates).toContainEqual(['club_pro_notices',expect.objectContaining({status:'sent',message_id:'delivered'})])
})
it.each(['canceled','changed','revoked'])('skips %s subscriptions or access before sending',async condition=>{
 if(condition==='canceled')state.subscription.state='canceled'
 if(condition==='changed')state.subscription.next_charge_at='2099-02-01T00:00:00Z'
 if(condition==='revoked')state.member.club_pro_status='inactive'
 await deliverProNotices();expect(state.send).not.toHaveBeenCalled()
 expect(state.updates).toContainEqual(['club_pro_notices',{status:'skipped'}])
})
it('leaves ambiguous email failures for operator review instead of automatic resend',async()=>{
 state.send.mockRejectedValue(new Error('ambiguous provider response'))
 expect(await deliverProNotices()).toMatchObject({failed:1})
 expect(state.send).toHaveBeenCalledTimes(1)
 expect(state.updates).toContainEqual(['club_pro_notices',{status:'failed'}])
})
it('explains the upcoming recurring charge without asking for another PIX',()=>{
 const message=buildProNotice('renewal','2099-01-01T00:00:00Z',false)
 expect(message.textBody).toContain('próxima cobrança')
 expect(message.textBody).toContain('Gerencie ou cancele')
 expect(message.textBody).not.toContain('PIX')
})
