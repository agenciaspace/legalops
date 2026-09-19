import { beforeEach, expect, it, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
const mocks=vi.hoisted(()=>({status:'unverified',review:null as any,profile:{full_name:'Ana Silva',current_role:'Advogada',organization_name:'Autônoma',linkedin_url:'https://www.linkedin.com/in/ana',public_bio:'Atuo em operações jurídicas e contratos.',areas_of_expertise:['Contratos'],directory_qualifications:[]}}))
vi.mock('@/lib/club-locale-server',()=>({getClubTranslator:()=>(text:string)=>text,getClubLocale:()=>'pt-BR'}))
vi.mock('@/lib/supabase-server',()=>({createServerSupabaseClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'owner'}}})},from:(table:string)=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:table==='account_profiles'?mocks.profile:{profile_verification_status:mocks.status}}),order:()=>({limit:async()=>({data:mocks.review?[mocks.review]:[]})})})})})})}))
vi.mock('@/app/(main)/community/actions',()=>({updateCommunityProfile:vi.fn()}))
vi.mock('@/app/(main)/community/profile/verification-actions',()=>({requestProfileVerification:vi.fn()}))
vi.mock('@/components/community/ProfilePhoto',()=>({ProfilePhoto:()=>null}))
vi.mock('@/components/community/ProfileContactCode',()=>({ProfileContactCode:()=>null}))
vi.mock('@/components/community/ClubRegionPreferences',()=>({ClubRegionPreferences:()=>null}))
import ProfilePage from '@/app/(main)/community/profile/page'
beforeEach(()=>{cleanup();mocks.status='unverified';mocks.review=null})
it('offers a review request for complete unverified profiles without a false pending state',async()=>{
 render(await ProfilePage({}))
 expect(screen.getByText('Validação não solicitada')).toBeInTheDocument()
 expect(screen.getByRole('button',{name:'Solicitar validação'})).toBeEnabled()
 expect(screen.queryByText('Em análise')).not.toBeInTheDocument()
})
it('shows queued requests and does not offer duplicate submission',async()=>{
 mocks.status='pending';mocks.review={submitted_at:'2026-09-19T00:00:00Z',status:'pending'}
 render(await ProfilePage({}))
 expect(screen.getByText('Em análise')).toBeInTheDocument()
 expect(screen.queryByRole('button',{name:'Solicitar validação'})).not.toBeInTheDocument()
})
it('shows the private adjustment reason and offers resubmission',async()=>{
 mocks.status='rejected';mocks.review={submitted_at:'2026-09-19T00:00:00Z',status:'rejected',review_note:'Atualize o nome da organização para conferência.'}
 render(await ProfilePage({}))
 expect(screen.getByText('Ajustes solicitados')).toBeInTheDocument()
 expect(screen.getByText(mocks.review.review_note)).toBeInTheDocument()
 expect(screen.getByRole('button',{name:'Solicitar validação'})).toBeEnabled()
})
