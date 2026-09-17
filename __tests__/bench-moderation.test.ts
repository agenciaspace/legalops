// @vitest-environment node
import {beforeEach, expect, it, vi} from 'vitest'
const state = vi.hoisted(() => ({user:null as any,admin:vi.fn(),rpc:vi.fn()}))
vi.mock('@/lib/supabase-server', () => ({createServerSupabaseClient:async()=>({auth:{getUser:async()=>({data:{user:state.user}})}})}))
vi.mock('@/lib/supabase-admin', () => ({createAdminClient:()=>{state.admin();return {rpc:state.rpc}}}))
vi.mock('next/navigation', () => ({redirect:(url:string)=>{throw new Error(url)}}))
vi.mock('next/cache', () => ({revalidatePath:vi.fn()}))
import {reviewBenchContribution} from '@/app/club/admin/bench/actions'
const id='00000000-0000-4000-8000-000000000001'
function form(decision='reject') {const f=new FormData();f.set('id',id);f.set('decision',decision);f.set('review_note','Insufficient evidence for publication.');f.set('reviewer_uuid','forged');return f}
beforeEach(()=>{vi.clearAllMocks();vi.stubEnv('LEGALOPS_ADMIN_EMAILS','admin@example.com');state.user=null;state.rpc.mockResolvedValue({error:null})})
it('denies anonymous users and self-declared admin metadata before service-role calls',async()=>{
  await expect(reviewBenchContribution(form())).rejects.toThrow('Forbidden')
  state.user={id:'attacker',email:'other@example.com',user_metadata:{role:'admin'}}
  await expect(reviewBenchContribution(form())).rejects.toThrow('Forbidden')
  expect(state.admin).not.toHaveBeenCalled()
})
it('uses only the authenticated reviewer and rejects publication without confirmation',async()=>{
  state.user={id:'real-reviewer',email:'admin@example.com'}
  await expect(reviewBenchContribution(form('approve'))).rejects.toThrow('verification')
  expect(state.rpc).not.toHaveBeenCalled()
  await expect(reviewBenchContribution(form())).rejects.toThrow('saved=1')
  expect(state.rpc).toHaveBeenCalledWith('review_bench_contribution',{submission_uuid:id,reviewer_uuid:'real-reviewer',decision:'reject',note:'Insufficient evidence for publication.',reviewed_content:null})
})
it('requires valid public content and handles double-review errors without claiming success',async()=>{
  state.user={id:'real-reviewer',email:'admin@example.com'}
  const f=form('approve');f.set('verified','on')
  await expect(reviewBenchContribution(f)).rejects.toThrow('error=content')
  expect(state.rpc).not.toHaveBeenCalled()
  state.rpc.mockResolvedValue({error:{message:'BENCH_ALREADY_REVIEWED'}})
  await expect(reviewBenchContribution(form())).rejects.toThrow('error=save')
})
