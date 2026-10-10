// @vitest-environment node
import {beforeEach,expect,it,vi} from 'vitest'
import {NextRequest} from 'next/server'
const s=vi.hoisted(()=>({user:{id:'owner'} as any,entry:true,filters:[] as unknown[][],bill:vi.fn(),cv:vi.fn()}))
vi.mock('@/lib/supabase-server',()=>({createServerSupabaseClient:async()=>({auth:{getUser:async()=>({data:{user:s.user}})},from:(table:string)=>{const q:any={select:()=>q,eq:(key:string,value:unknown)=>{s.filters.push([table,key,value]);return q},single:async()=>({data:s.entry?{id:'entry',job_id:'job',job:{title:'Role',company:'Company',raw_description:'Source',benefits:[]}}:null}),maybeSingle:async()=>({data:s.entry?{id:'entry',job_id:'job'}:null})};return q}})}))
vi.mock('@/lib/club-credits',async original=>({...await original<typeof import('@/lib/club-credits')>(),withCreditAction:s.bill}))
vi.mock('@/lib/personalized-cv',()=>({createPersonalizedCvForEntry:s.cv}))
import {CreditError} from '@/lib/club-credits'
import {POST as letter} from '@/app/api/ai/cover-letter/route'
import {POST as interview} from '@/app/api/ai/interview-prep/route'
import {POST as cv} from '@/app/api/pipeline/[entryId]/cv/route'
const req=(origin='https://legalops.club')=>new NextRequest('https://legalops.club/api/ai/test',{method:'POST',headers:{origin},body:JSON.stringify({entry_id:'entry',user_id:'intruder'})})
beforeEach(()=>{vi.clearAllMocks();s.user={id:'owner'};s.entry=true;s.filters=[];s.bill.mockImplementation(async(_owner,_action,run)=>run(async()=> 'Result',{funding:'api'}));s.cv.mockResolvedValue({markdown:'CV'})})
it('routes each owned career generation through its specific wallet tariff',async()=>{
 expect((await letter(req())).status).toBe(200);expect((await interview(req())).status).toBe(200);expect((await cv(req(),{params:Promise.resolve({entryId:'entry'})})).status).toBe(200)
 expect(s.bill.mock.calls.map(call=>call.slice(0,2))).toEqual([['owner','cover_letter'],['owner','interview_prep'],['owner','personalized_cv']])
 expect(s.filters.filter(([,key])=>key==='user_id').every(([, ,value])=>value==='owner')).toBe(true)
 expect(s.cv).toHaveBeenCalledWith(expect.objectContaining({generate:expect.any(Function),model:'gpt-4.1-mini'}))
})
it('blocks foreign origins and missing ownership before billing',async()=>{
 expect((await letter(req('https://other.example'))).status).toBe(403)
 s.entry=false;expect((await interview(req())).status).toBe(404);expect((await cv(req(),{params:Promise.resolve({entryId:'entry'})})).status).toBe(404)
 expect(s.bill).not.toHaveBeenCalled()
})
it('returns actionable insufficient-credit errors instead of a generic generation failure',async()=>{
 s.bill.mockRejectedValue(new CreditError('INSUFFICIENT_CREDITS',402))
 const response=await letter(req());expect(response.status).toBe(402);expect((await response.json()).error).toContain('Créditos insuficientes')
})
