import { ClubLanguageProvider } from '@/components/community/ClubLanguage'
import { getClubLocale } from '@/lib/club-locale-server'
import { isLegalOpsAdminEmail } from '@/lib/legalops-admin'
import { hasClubProAccess } from '@/lib/club-membership'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Nav } from '@/components/Nav'
import { AppMain } from '@/components/AppMain'
import { redirect } from 'next/navigation'
import { hasActiveClubAccess } from '@/lib/community'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  // Middleware protects the private routes. Public event pages also live in
  // this route group, so let those pages render without the authenticated nav.
  if (!user) return <ClubLanguageProvider initialLocale={getClubLocale()}><div className="min-h-screen bg-[#F5F1E8]">{children}</div></ClubLanguageProvider>

  const [{ data: pipeline }, { data: clubAccess }] = await Promise.all([
    supabase
      .from('user_pipeline_entries')
      .select('job_id')
      .eq('user_id', user.id),
    supabase
      .from('community_members')
      .select('user_id,display_name,avatar_path,club_access_status, club_access_expires_at, club_pro_status, club_pro_expires_at')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const excludedIds = pipeline?.map(e => e.job_id) ?? []

  let countQuery = supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('enrichment_status', 'done')
    .eq('url_status', 'live')
    .not('url_checked_at', 'is', null)

  if (excludedIds.length > 0) {
    countQuery = countQuery.not('id', 'in', `(${excludedIds.join(',')})`)
  }

  const hasClubAccess = hasActiveClubAccess(clubAccess) && hasClubProAccess(clubAccess)
  const [{ count }, { count: jobAlertCount }] = await Promise.all([
    countQuery,
    hasClubAccess
      ? supabase
        .from('club_job_alerts')
        .select('id', { count: 'exact', head: true })
        .is('read_at', null)
        .is('dismissed_at', null)
      : Promise.resolve({ count: 0 }),
  ])

  return (
    <ClubLanguageProvider initialLocale={getClubLocale()}><div className="min-h-screen bg-[#F5F1E8]">
      <Nav member={clubAccess} discoverCount={count ?? 0} jobAlertCount={jobAlertCount ?? 0} hasClubAccess={hasClubAccess} isClubAdmin={isLegalOpsAdminEmail(user.email)} />
      <AppMain>{children}</AppMain>
    </div></ClubLanguageProvider>
  )
}
