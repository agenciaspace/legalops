import type { Metadata } from 'next'
import { ClubPwa } from '@/components/community/ClubPwa'
import { ClubWelcomeNotice } from '@/components/community/ClubWelcomeNotice'
import { hasClubProAccess } from '@/lib/club-membership'
import { CommunityTabs } from '@/components/community/CommunityTabs'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getInitials, hasActiveClubAccess } from '@/lib/community'

export const metadata: Metadata = { title: 'Comunidade | legalops.club', description: 'Posts, Bench e Pro em áreas próprias.', manifest: '/club-pwa/manifest.webmanifest', appleWebApp: { capable: true, title: 'LegalOps Club', statusBarStyle: 'default' }, icons: { apple: '/club-pwa/icon-192.png' } }

export default async function CommunityLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [{ data: member }, { count }] = await Promise.all([
    supabase
      .from('community_members')
      .select('display_name, current_role, club_access_status, club_access_expires_at, club_pro_status, club_pro_expires_at')
      .eq('user_id', user?.id ?? '')
      .maybeSingle(),
    supabase
      .from('community_members')
      .select('user_id', { count: 'exact', head: true }),
  ])

  const memberName = member?.display_name?.trim() || user?.email?.split('@')[0] || 'Membro LegalOps'
  const hasPaidAccess = hasActiveClubAccess(member) && hasClubProAccess(member)

  return (
    <div className="club-shell min-h-[calc(100dvh-4rem)] bg-[#F3F0E8] text-[#24231F]">
      <div className="flex items-start">
        <CommunityTabs
          memberName={memberName}
          memberRole={member?.current_role}
          memberCount={count ?? 0}
          initials={getInitials(memberName)}
          hasPaidAccess={hasPaidAccess}
        />
        <div className="club-content min-w-0 flex-1"><ClubPwa /><ClubWelcomeNotice />{children}</div>
      </div>
    </div>
  )
}
