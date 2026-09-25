import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { hasActiveClubAccess } from '@/lib/community'
import { ClubJoinForm } from './ClubJoinForm'
import { clubReturnPath } from '@/lib/club-return-path'
export const metadata = { title: 'Complete seu perfil | legalops.club' }
export default async function ClubJoinPage({ searchParams }: { searchParams?: {next?:string} }) {
  const destination = clubReturnPath(searchParams?.next) ?? '/community'
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/cadastro?next=${encodeURIComponent(destination)}`)
  const [{ data: member }, { data: profile }] = await Promise.all([
    supabase.from('community_members').select('club_access_status,club_access_expires_at').eq('user_id', user.id).maybeSingle(),
    supabase.from('account_profiles').select('country_code,timezone,avatar_path,full_name,current_role,organization_name,linkedin_url,public_bio,preferred_locations,areas_of_expertise').eq('user_id', user.id).maybeSingle(),
  ])
  if (hasActiveClubAccess(member)) redirect(destination)
  return <ClubJoinForm userId={user.id} profile={profile ?? {}} destination={destination} />
}
