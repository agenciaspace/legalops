import { beforeEach, expect, it, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
const mocks=vi.hoisted(()=>({status:'verified',profile:{avatar_path:'owner/11111111-1111-4111-8111-111111111111.jpg',full_name:'Ana Silva',current_role:'Advogada',organization_name:'Autônoma',linkedin_url:'https://www.linkedin.com/in/ana',public_bio:'Atuo em operações jurídicas e contratos.',areas_of_expertise:['Contratos'],directory_qualifications:[]}}))
vi.mock('@/lib/club-locale-server',()=>({getClubTranslator:()=>(text:string)=>text,getClubLocale:()=>'pt-BR'}))
vi.mock('@/lib/supabase-server',()=>({createServerSupabaseClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'owner'}}})},from:(table:string)=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:table==='account_profiles'?mocks.profile:{profile_verification_status:mocks.status}})})})})})}))
vi.mock('@/app/(main)/community/actions',()=>({updateCommunityProfile:vi.fn()}))
vi.mock('@/components/community/ProfilePhoto',()=>({ProfilePhoto:()=>null}))
vi.mock('@/components/community/ProfileContactCode',()=>({ProfileContactCode:()=>null}))
vi.mock('@/components/community/ClubRegionPreferences',()=>({ClubRegionPreferences:()=>null}))
import ProfilePage from '@/app/(main)/community/profile/page'
beforeEach(()=>{cleanup();mocks.status='verified';mocks.profile.avatar_path='owner/11111111-1111-4111-8111-111111111111.jpg'})
it('shows automatic completion without a manual review action',async()=>{
 render(await ProfilePage({}))
 expect(screen.getByText('Cadastro completo')).toBeInTheDocument()
 expect(screen.queryByRole('button',{name:'Solicitar validação'})).not.toBeInTheDocument()
})
it('shows the missing photo in an incomplete profile',async()=>{
 mocks.status='unverified';mocks.profile.avatar_path=''
 render(await ProfilePage({}))
 expect(screen.getByText('Cadastro incompleto')).toBeInTheDocument()
 expect(screen.getByText(/Falta completar: Foto/)).toBeInTheDocument()
})
