import { beforeEach, expect, it, vi } from 'vitest'
const mocks=vi.hoisted(()=>({user:{id:'owner',email:'member@example.test'} as {id:string;email:string}|null,admin:false,rpc:vi.fn(),adminRpc:vi.fn(),adminClient:vi.fn()}))
vi.mock('@/lib/supabase-server',()=>({createServerSupabaseClient:async()=>({auth:{getUser:async()=>({data:{user:mocks.user}})},rpc:mocks.rpc})}))
vi.mock('@/lib/supabase-admin',()=>({createAdminClient:()=>{mocks.adminClient();return{rpc:mocks.adminRpc}}}))
vi.mock('@/lib/legalops-admin',()=>({isLegalOpsAdminEmail:()=>mocks.admin}))
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}))
vi.mock('next/navigation',()=>({redirect:(url:string)=>{throw Error(url)}}))
import { requestProfileVerification } from '@/app/(main)/community/profile/verification-actions'
import { reviewMemberProfile } from '@/app/club/admin/members/actions'
beforeEach(()=>{mocks.user={id:'owner',email:'member@example.test'};mocks.admin=false;mocks.rpc.mockReset().mockResolvedValue({error:null});mocks.adminRpc.mockReset().mockResolvedValue({error:null});mocks.adminClient.mockClear()})
const review=()=>{const form=new FormData();form.set('request_id','00000000-0000-0000-0000-000000000001');form.set('decision','verified');form.set('note','Identidade e contexto conferidos.');form.set('checked','on');return form}
it('does not allow anonymous verification requests',async()=>{mocks.user=null;await expect(requestProfileVerification()).rejects.toThrow('/login');expect(mocks.rpc).not.toHaveBeenCalled()})
it('submits only the authenticated identity through the guarded RPC',async()=>{await expect(requestProfileVerification()).rejects.toThrow('verification=requested');expect(mocks.rpc).toHaveBeenCalledWith('request_club_profile_review')})
it('shows incomplete requests without claiming they are queued',async()=>{mocks.rpc.mockResolvedValue({error:{message:'PROFILE_INCOMPLETE'}});await expect(requestProfileVerification()).rejects.toThrow('verification=incomplete')})
it('blocks ordinary members before constructing a service-role client',async()=>{await expect(reviewMemberProfile(review())).rejects.toThrow('/community');expect(mocks.adminClient).not.toHaveBeenCalled()})
it('requires explicit administrator verification before approval',async()=>{mocks.admin=true;const form=review();form.delete('checked');await expect(reviewMemberProfile(form)).rejects.toThrow('error=fields');expect(mocks.adminRpc).not.toHaveBeenCalled()})
it('takes reviewer identity from the authenticated user and uses the atomic RPC',async()=>{mocks.admin=true;const form=review();form.set('p_operator','spoof');await expect(reviewMemberProfile(form)).rejects.toThrow('saved=1');expect(mocks.adminRpc).toHaveBeenCalledWith('review_club_profile',expect.objectContaining({p_operator:'owner',p_decision:'verified'}))})
it('keeps conflicting requests out of a success state',async()=>{mocks.admin=true;mocks.adminRpc.mockResolvedValue({error:{message:'ALREADY_REVIEWED'}});await expect(reviewMemberProfile(review())).rejects.toThrow('error=conflict')})
