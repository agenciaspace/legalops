import {render,screen,within} from '@testing-library/react'
import {expect,it,vi} from 'vitest'
const uid='11111111-1717-4717-8717-111111111111'
vi.mock('@/lib/supabase-admin',()=>({createAdminClient:vi.fn(()=>{throw new Error('Service client must not be needed for author identity')})}))
vi.mock('@/app/(main)/community/actions',()=>({createCommunityComment:vi.fn(),createCommunityPost:vi.fn(),toggleCommunityPostLike:vi.fn()}))
vi.mock('@/lib/supabase-server',()=>({createServerSupabaseClient:async()=>({
 auth:{getUser:async()=>({data:{user:{id:uid}}})},
 from:(table:string)=>{
  let columns='';
  const result=()=>({data:table==='community_posts'?[{id:'post-one',author_id:uid,author_name:'Nome antigo',author_role:'Cargo antigo',category:'discussao',title:'Escolha de CLM',body:'Como organizar o piloto?',created_at:'2026-09-17T12:00:00Z',community_comments:[],community_post_likes:[]}]:table==='community_members'&&columns.includes('organization_description')?[{user_id:uid,display_name:'Nome atual',current_role:'Legal Ops',organization_name:'Empresa atual',organization_description:'Organizo contratos e integrações no jurídico da empresa.',avatar_path:`${uid}/${uid}.jpg`}]:[]})
  const q:any={select:(value:string)=>{columns=value;return q},eq:()=>q,in:()=>q,gte:()=>q,order:()=>q,limit:()=>q,maybeSingle:async()=>({data:null}),then:(resolve:any)=>Promise.resolve(result()).then(resolve)};return q
 }
})}))
import CommunityPage from '@/app/(main)/community/page'
it('shows the current member photo and workplace prominently on an existing post',async()=>{
 const {container}=render(await CommunityPage({}))
 const post=container.querySelector('#post-post-one') as HTMLElement
 expect(within(post).getByRole('link',{name:'Nome atual'})).toHaveAttribute('href',`/community/members/${uid}`)
 expect(within(post).getByText('Legal Ops · Empresa atual')).toBeVisible()
 const workplace=within(post).getByText('Organizo contratos e integrações no jurídico da empresa.')
 expect(workplace).toBeVisible()
 expect(workplace.compareDocumentPosition(within(post).getByRole('heading',{name:'Escolha de CLM'}))&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
 expect(within(post).getByRole('img',{name:'Foto de Nome atual'})).toHaveAttribute('src',`/api/club/avatar/${uid}?v=${uid}.jpg`)
 expect(screen.queryByText('Nome antigo')).not.toBeInTheDocument()
})
