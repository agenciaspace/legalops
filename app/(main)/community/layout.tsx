import { CommunityTabs } from '@/components/community/CommunityTabs'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getInitials, hasActiveClubAccess } from '@/lib/community'

export default async function CommunityLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [{ data: member }, { count }] = await Promise.all([
    supabase
      .from('community_members')
      .select('display_name, current_role, club_access_status, club_access_expires_at')
      .eq('user_id', user?.id ?? '')
      .maybeSingle(),
    supabase
      .from('community_members')
      .select('user_id', { count: 'exact', head: true }),
  ])

  const memberName = member?.display_name?.trim() || user?.email?.split('@')[0] || 'Membro LegalOps'
  const hasPaidAccess = hasActiveClubAccess(member)

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F7F7F5] text-[#24231F]">
      <div className="flex items-start">
        <CommunityTabs
          memberName={memberName}
          memberRole={member?.current_role}
          memberCount={count ?? 0}
          initials={getInitials(memberName)}
          hasPaidAccess={hasPaidAccess}
        />
        <div className="min-w-0 flex-1 pt-[53px] lg:pt-0">{children}</div>
      </div>
    </div>
  )
}
