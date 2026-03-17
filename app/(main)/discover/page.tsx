import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { extractSalaryFromHtml, type ExtractedSalary } from '@/lib/utils'
import { fetchJobDescription } from '@/lib/scraper'
import { DiscoverClient } from './DiscoverClient'

function parseSalaryNum(val: string | null): number | null {
  if (!val) return null
  let cleaned = val.replace(/[R$€£₹¥A$C$S$HK$NZ$CHFkrzł₪,\s]/g, '')
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

function toSalaryFields(extracted: ExtractedSalary | null) {
  if (!extracted) return null
  const salary_min = parseSalaryNum(extracted.min)
  const salary_max = parseSalaryNum(extracted.max)
  if (!salary_min && !salary_max) return null
  return { salary_min, salary_max, salary_currency: extracted.currency ?? null }
}

/**
 * Backfill salary_min/salary_max for jobs missing salary data.
 * Strategy 1: extract from stored raw_description text.
 * Strategy 2: re-fetch the job page URL and extract from fresh HTML.
 * Runs on page load with admin privileges. Self-heals: once salary is set,
 * the job won't be queried again.
 */
async function backfillMissingSalaries() {
  const admin = createAdminClient()
  const { data: jobs } = await admin
    .from('jobs')
    .select('id, url, raw_description')
    .eq('enrichment_status', 'done')
    .is('salary_min', null)
    .is('salary_max', null)
    .limit(20)

  if (!jobs || jobs.length === 0) return

  await Promise.all(jobs.map(async (job) => {
    // Strategy 1: try extracting from stored raw_description
    if (job.raw_description) {
      const salary = toSalaryFields(extractSalaryFromHtml(job.raw_description))
      if (salary) {
        await admin.from('jobs').update(salary).eq('id', job.id)
        return
      }
    }

    // Strategy 2: re-fetch the job page and extract salary from fresh HTML
    if (job.url) {
      try {
        const { extractedSalary } = await fetchJobDescription(job.url)
        const salary = toSalaryFields(extractedSalary)
        if (salary) {
          await admin.from('jobs').update(salary).eq('id', job.id)
        }
      } catch {
        // Fetch failed, skip
      }
    }
  }))
}

export default async function DiscoverPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Backfill salary data for existing jobs before rendering
  await backfillMissingSalaries()

  const [
    { data: pipeline },
  ] = await Promise.all([
    supabase
      .from('user_pipeline_entries')
      .select('job_id')
      .eq('user_id', user!.id),
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

  return (
    <DiscoverClient initialJobs={jobs ?? []} />
  )
}
