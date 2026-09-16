import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { hasActiveClubAccess } from '@/lib/community'
import { ClubJoinForm } from './ClubJoinForm'
export const metadata = { title: 'Complete seu perfil | legalops.club' }
export default async function ClubJoinPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/cadastro')
  const [{ data: member }, { data: profile }] = await Promise.all([
    supabase.from('community_members').select('club_access_status,club_access_expires_at').eq('user_id', user.id).maybeSingle(),
    supabase.from('account_profiles').select('full_name,current_role,organization_name,linkedin_url,public_bio,preferred_locations,areas_of_expertise').eq('user_id', user.id).maybeSingle(),
  ])
  if (hasActiveClubAccess(member)) redirect('/community')
  return <ClubJoinForm profile={profile ?? {}} />
}
