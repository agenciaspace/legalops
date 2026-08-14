import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Nav } from '@/components/Nav'
import { AppMain } from '@/components/AppMain'
import { redirect } from 'next/navigation'
import { hasActiveClubAccess } from '@/lib/community'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: pipeline }, { data: clubAccess }] = await Promise.all([
    supabase
      .from('user_pipeline_entries')
      .select('job_id')
      .eq('user_id', user.id),
    supabase
      .from('community_members')
      .select('club_access_status, club_access_expires_at')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const excludedIds = pipeline?.map(e => e.job_id) ?? []

  let countQuery = supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('enrichment_status', 'done')

  if (excludedIds.length > 0) {
    countQuery = countQuery.not('id', 'in', `(${excludedIds.join(',')})`)
  }

  const hasClubAccess = hasActiveClubAccess(clubAccess)
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
    <div className="min-h-screen bg-[#F5F4F0]">
      <Nav discoverCount={count ?? 0} jobAlertCount={jobAlertCount ?? 0} hasClubAccess={hasClubAccess} />
      <AppMain>{children}</AppMain>
    </div>
  )
}
