import type { CrawlerRun } from '@/lib/crawler-runs'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { DiscoverClient } from './DiscoverClient'

export default async function DiscoverPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [
    { data: pipeline },
    { data: latestRun },
    { data: recentRuns },
  ] = await Promise.all([
    supabase
      .from('user_pipeline_entries')
      .select('job_id')
      .eq('user_id', user!.id),
    supabase
      .from('crawler_runs')
      .select('*')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('crawler_runs')
      .select('inserted_count')
      .gte('completed_at', sevenDaysAgo.toISOString()),
  ])

  const excludedIds = pipeline?.map(e => e.job_id) ?? []

  let query = supabase
    .from('jobs')
    .select('*')
    .eq('enrichment_status', 'done')
    .order('created_at', { ascending: false })
    .limit(20)

  if (excludedIds.length > 0) {
    query = query.not('id', 'in', `(${excludedIds.join(',')})`)
  }

  const { data: jobs } = await query

  const insertedLast7Days = (recentRuns ?? []).reduce(
    (sum, run) => sum + (typeof run.inserted_count === 'number' ? run.inserted_count : 0),
    0
  )

  return (
    <DiscoverClient
      initialJobs={jobs ?? []}
      crawlerStats={{
        latestRun: (latestRun as CrawlerRun | null) ?? null,
        insertedLast7Days,
      }}
    />
  )
}
