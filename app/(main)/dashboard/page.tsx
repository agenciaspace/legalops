import { createServerSupabaseClient } from '@/lib/supabase-server'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: entries } = await supabase
    .from('user_pipeline_entries')
    .select('id, status, created_at, applied_at, job:jobs(title, company, remote_reality, salary_min, salary_max, salary_currency)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const all = entries ?? []

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const researching = all.filter(e => e.status === 'researching').length
  const applied = all.filter(e => e.status === 'applied').length
  const interview = all.filter(e => e.status === 'interview').length
  const offer = all.filter(e => e.status === 'offer').length
  const discarded = all.filter(e => e.status === 'discarded').length

  const appliedThisWeek = all.filter(e =>
    e.applied_at && new Date(e.applied_at) >= oneWeekAgo
  ).length

  const interviewsThisWeek = all.filter(e =>
    e.status === 'interview' && new Date(e.created_at) >= oneWeekAgo
  ).length

  const totalActive = all.filter(e => e.status !== 'discarded').length
  const responseRate = totalActive > 0
    ? Math.round(((interview + offer) / totalActive) * 100)
    : 0

  const stats = {
    total_tracked: all.length,
    researching,
    applied,
    interview,
    offer,
    discarded,
    applied_this_week: appliedThisWeek,
    interviews_this_week: interviewsThisWeek,
    response_rate: responseRate,
  }

  const recentActivity = all.slice(0, 10).map(e => ({
    id: e.id,
    status: e.status,
    job: e.job as unknown as { title: string; company: string; remote_reality: string; salary_min: number | null; salary_max: number | null; salary_currency: string | null },
    created_at: e.created_at,
  }))

  return <DashboardClient stats={stats} recentActivity={recentActivity} />
}
