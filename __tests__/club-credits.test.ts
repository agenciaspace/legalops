// @vitest-environment node
import {beforeEach,expect,it,vi} from 'vitest'
const state=vi.hoisted(()=>({rpc:vi.fn(),platform:vi.fn(),own:vi.fn(),key:vi.fn()}))
vi.mock('@/lib/supabase-admin',()=>({createAdminClient:()=>({rpc:state.rpc})}))
vi.mock('@/lib/openrouter',()=>({generateOpenRouterText:state.platform}))
vi.mock('@/lib/club-api-key',async original=>({...await original<typeof import('@/lib/club-api-key')>(),generateMemberOpenAIText:state.own,loadMemberKey:state.key}))
import {withCreditAction,CreditError} from '@/lib/club-credits'
const prompt={systemPrompt:'System',userPrompt:'Question',maxTokens:3000}
beforeEach(()=>{vi.clearAllMocks();state.rpc.mockImplementation(async name=>name==='reserve_club_credits'?{data:{id:'reservation',funding:'club',cost:3}}:{error:null});state.platform.mockResolvedValue('Generated');state.own.mockResolvedValue('Personal');state.key.mockResolvedValue('member-key')})
it('uses the server action tariff and settles after the result is saved',async()=>{
 const saved=vi.fn(async()=>{})
 expect(await withCreditAction('owner','personalized_cv',async generate=>{const text=await generate(prompt);await saved();return text})).toBe('Generated')
 expect(state.rpc).toHaveBeenNthCalledWith(1,'reserve_club_credits',{member_id:'owner',action_name:'personalized_cv'})
 expect(state.rpc).toHaveBeenLastCalledWith('finish_club_credits',{transaction_id:'reservation',failed:false})
 expect(saved.mock.invocationCallOrder[0]).toBeLessThan(state.rpc.mock.invocationCallOrder[1]);expect(state.key).not.toHaveBeenCalled()
})
it('refunds a failed save or invalid result without charging personal API',async()=>{
 await expect(withCreditAction('owner','personalized_cv',async generate=>{await generate(prompt);throw new Error('invalid output')})).rejects.toThrow('invalid output')
 expect(state.rpc).toHaveBeenLastCalledWith('finish_club_credits',{transaction_id:'reservation',failed:true});expect(state.own).not.toHaveBeenCalled()
})
it('uses only the owner key for API funding and preserves feature token limits',async()=>{
 state.rpc.mockImplementation(async name=>name==='reserve_club_credits'?{data:{id:'reservation',funding:'api',cost:3}}:{error:null})
 expect(await withCreditAction('owner','personalized_cv',generate=>generate(prompt))).toBe('Personal')
 expect(state.key).toHaveBeenCalledWith('owner');expect(state.own).toHaveBeenCalledWith('member-key',prompt);expect(state.platform).not.toHaveBeenCalled()
})
it('fails closed when the personal key disappears after reservation',async()=>{
 state.rpc.mockImplementation(async name=>name==='reserve_club_credits'?{data:{id:'reservation',funding:'api',cost:3}}:{error:null});state.key.mockResolvedValue(null)
 await expect(withCreditAction('owner','cover_letter',generate=>generate(prompt))).rejects.toThrow('invalid_api_key')
 expect(state.platform).not.toHaveBeenCalled();expect(state.own).not.toHaveBeenCalled()
})
it('does not invoke paid generation when credits or Pro access are absent',async()=>{
 for(const [message,status] of [['INSUFFICIENT_CREDITS',402],['PRO_REQUIRED',403],['QUESTION_IN_PROGRESS',429]] as const){
  state.rpc.mockResolvedValue({error:{message}})
  await expect(withCreditAction('owner','interview_prep',generate=>generate(prompt))).rejects.toMatchObject({code:message,status})
 }
 expect(state.platform).not.toHaveBeenCalled();expect(state.key).not.toHaveBeenCalled()
})
