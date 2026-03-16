import type { CrawlerRun } from '@/lib/crawler-runs'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { extractSalaryFromHtml } from '@/lib/utils'
import { DiscoverClient } from './DiscoverClient'

/**
 * Backfill salary_min/salary_max for jobs that have salary text in raw_description
 * but no structured salary data yet. Runs once per page load with admin privileges.
 */
async function backfillMissingSalaries() {
  const admin = createAdminClient()
  const { data: jobs } = await admin
    .from('jobs')
    .select('id, raw_description')
    .eq('enrichment_status', 'done')
    .is('salary_min', null)
    .is('salary_max', null)
    .limit(50)

  if (!jobs || jobs.length === 0) return

  for (const job of jobs) {
    if (!job.raw_description) continue
    const extracted = extractSalaryFromHtml(job.raw_description)
    if (!extracted) continue

    const parseNum = (val: string | null): number | null => {
      if (!val) return null
      let cleaned = val.replace(/[R$€£₹¥,\s]/g, '')
      if (/k$/i.test(val.replace(/\s+/g, ''))) {
        cleaned = cleaned.replace(/k$/i, '')
        const num = parseFloat(cleaned)
        return isNaN(num) ? null : Math.round(num * 1000)
      }
      if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
        cleaned = cleaned.replace(/\./g, '')
      }
      const num = parseFloat(cleaned)
      return isNaN(num) ? null : Math.round(num)
    }

    const salary_min = parseNum(extracted.min)
    const salary_max = parseNum(extracted.max)
    if (!salary_min && !salary_max) continue

    await admin
      .from('jobs')
      .update({ salary_min, salary_max, salary_currency: extracted.currency ?? null })
      .eq('id', job.id)
  }
}

export default async function DiscoverPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Backfill salary data for existing jobs before rendering
  await backfillMissingSalaries()

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
