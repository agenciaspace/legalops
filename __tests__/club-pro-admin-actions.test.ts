// @vitest-environment node
import {beforeEach,expect,it,vi} from 'vitest'
const state=vi.hoisted(()=>({user:{id:'operator',email:'admin@example.test'} as any,rpc:vi.fn(),update:vi.fn(),client:vi.fn(),notify:vi.fn()}))
vi.mock('next/navigation',()=>({redirect:(path:string)=>{throw new Error(`REDIRECT:${path}`)}}))
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}))
vi.mock('@/lib/supabase-server',()=>({createServerSupabaseClient:async()=>({auth:{getUser:async()=>({data:{user:state.user}})}})}))
vi.mock('@/lib/supabase-admin',()=>({createAdminClient:()=>{state.client();return {rpc:state.rpc,from:()=>{const q:any={select:()=>q,eq:()=>q,update:state.update,single:async()=>({data:{payment_mode:'mercadopago_subscription',user_id:'member'}})};return q}}}}))
vi.mock('@/lib/club-job-matching',()=>({generateClubJobAlerts:vi.fn()}))
vi.mock('@/lib/club-pro-notices',()=>({deliverProNotices:state.notify}))
import {reviewProOrder,recordSubscriptionPayment,recordSubscriptionCancellation,recordProRefund,retryProNotice,configureProOffer,updatePilotCounts} from '@/app/club/admin/pro/actions'
beforeEach(()=>{vi.clearAllMocks();vi.stubEnv('LEGALOPS_ADMIN_EMAILS','admin@example.test');state.user={id:'operator',email:'admin@example.test'};state.rpc.mockResolvedValue({error:null});state.notify.mockResolvedValue({sent:1})})
const actions=[reviewProOrder,recordSubscriptionPayment,recordSubscriptionCancellation,recordProRefund,retryProNotice,configureProOffer,updatePilotCounts]
it('requires an allowlisted administrator before any billing or metrics access',async()=>{
 for(const user of [null,{id:'member',email:'member@example.test'}]){
  state.user=user
  for(const action of actions)await expect(action(new FormData())).rejects.toThrow('REDIRECT:/community')
 }
 expect(state.client).not.toHaveBeenCalled()
})
it('requires provider verification before granting, renewing, canceling or refunding',async()=>{
 const form=new FormData();form.set('decision','approve')
 for(const action of [reviewProOrder,recordSubscriptionPayment,recordSubscriptionCancellation,recordProRefund,retryProNotice])await expect(action(form)).rejects.toThrow('error=verify')
 expect(state.rpc).not.toHaveBeenCalled();expect(state.update).not.toHaveBeenCalled();expect(state.notify).not.toHaveBeenCalled()
})
it('records a verified payment using the provider date in Brasilia and not the submitted operator',async()=>{
 const form=new FormData();form.set('verified','on');form.set('user_id','member');form.set('operator_id','attacker');form.set('payment_id','123456');form.set('cycle_expires_at','2026-11-12T10:00')
 await expect(recordSubscriptionPayment(form)).rejects.toThrow('saved=1')
 expect(state.rpc).toHaveBeenCalledWith('record_club_pro_subscription_payment',{member_id:'member',operator_id:'operator',payment_id:'123456',cycle_expires_at:'2026-11-12T13:00:00.000Z'})
 expect(state.notify).toHaveBeenCalledOnce()
})
it('leaves notifications untouched when the database rejects a payment',async()=>{
 state.rpc.mockResolvedValue({error:{message:'duplicate payment'}})
 const form=new FormData();form.set('verified','on');form.set('cycle_expires_at','2026-11-12T10:00')
 await expect(recordSubscriptionPayment(form)).rejects.toThrow('error=review')
 expect(state.notify).not.toHaveBeenCalled()
})
