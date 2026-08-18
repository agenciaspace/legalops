import { redirect } from 'next/navigation'
import { ClubOffice } from '@/components/community/ClubOffice'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { hasActiveClubAccess } from '@/lib/community'

export const dynamic = 'force-dynamic'

export default async function CommunityOfficePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/community/office')

  const { data: member } = await supabase
    .from('community_members')
    .select('user_id, display_name, current_role, organization_name, public_headline, profile_verification_status, club_access_status, club_access_expires_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member || !hasActiveClubAccess(member)) redirect('/community?upgrade=1')

  return (
    <ClubOffice
      member={{
        userId: member.user_id,
        displayName: member.display_name?.trim() || user.email?.split('@')[0] || 'Membro LegalOps',
        currentRole: member.current_role,
        organizationName: member.organization_name,
        publicHeadline: member.public_headline,
        verified: member.profile_verification_status === 'verified',
      }}
    />
  )
}
