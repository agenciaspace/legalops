// @vitest-environment node
import {beforeEach,expect,it,vi} from 'vitest'
const state=vi.hoisted(()=>({allowed:true,user:{id:'operator',email:'admin@example.invalid'} as any,rpc:vi.fn()}))
vi.mock('next/navigation',()=>({redirect:(path:string)=>{throw new Error('REDIRECT:'+path)}}))
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}))
vi.mock('@/lib/supabase-server',()=>({createServerSupabaseClient:async()=>({auth:{getUser:async()=>({data:{user:state.user}})}})}))
vi.mock('@/lib/legalops-admin',()=>({isLegalOpsAdminEmail:()=>state.allowed}))
vi.mock('@/lib/supabase-admin',()=>({createAdminClient:()=>({rpc:state.rpc})}))
import {configureCredits,reviewCreditOrder} from '@/app/club/admin/credits/actions'
beforeEach(()=>{state.allowed=true;state.user={id:'operator',email:'admin@example.invalid'};state.rpc.mockReset().mockResolvedValue({error:null})})
function configuration(){const form=new FormData();for(const [key,value] of Object.entries({allowance:30,period:'day',agent_question:1,agent_summary:2,personalized_cv:5,cover_letter:3,interview_prep:3,linkedin_insights:2}))form.set(key,String(value));return form}
it('blocks non-admin configuration and approval before accessing service role',async()=>{
 state.allowed=false;await expect(configureCredits(configuration())).rejects.toThrow('REDIRECT:/community');await expect(reviewCreditOrder(new FormData())).rejects.toThrow('REDIRECT:/community');expect(state.rpc).not.toHaveBeenCalled()
})
it('allows configuring costs while leaving unpriced packs closed',async()=>{
 await expect(configureCredits(configuration())).rejects.toThrow('saved=1')
 expect(state.rpc).toHaveBeenCalledWith('configure_club_credits',expect.objectContaining({included_allowance:30,pack_amount:null,pack_price:null,sales_enabled:false,action_costs:expect.objectContaining({personalized_cv:5})}))
})
it('rejects zero or fractional costs and sales without a price',async()=>{
 for(const value of ['0','1.5']){const f=configuration();f.set('agent_question',value);await expect(configureCredits(f)).rejects.toThrow('error=settings')}
 const f=configuration();f.set('sales_active','on');await expect(configureCredits(f)).rejects.toThrow('error=settings');expect(state.rpc).not.toHaveBeenCalled()
})
it('requires bank confirmation and uses authenticated operator',async()=>{
 const f=new FormData();f.set('order_id','purchase');f.set('decision','approve');f.set('operator_id','intruder')
 await expect(reviewCreditOrder(f)).rejects.toThrow('error=verify');expect(state.rpc).not.toHaveBeenCalled()
 f.set('verified','on');await expect(reviewCreditOrder(f)).rejects.toThrow('saved=1');expect(state.rpc).toHaveBeenCalledWith('approve_club_credit_order',{order_id:'purchase',operator_id:'operator'})
})
