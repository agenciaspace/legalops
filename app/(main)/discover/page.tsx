import type { CrawlerRun } from '@/lib/crawler-runs'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { extractSalaryFromHtml, type ExtractedSalary } from '@/lib/utils'
import { fetchJobDescription } from '@/lib/scraper'
import { resolveCompanyLogoUrl } from '@/lib/company-logo'
import { isPublishableJobRecord } from '@/lib/job-publication'
import { normalizeSalaryRange, parseSalaryNumber } from '@/lib/format-salary'
import { DiscoverClient } from './DiscoverClient'

function toSalaryFields(extracted: ExtractedSalary | null) {
  if (!extracted) return null
  const { salary_min, salary_max } = normalizeSalaryRange(
    parseSalaryNumber(extracted.min),
    parseSalaryNumber(extracted.max),
  )
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
    .select('id, url, company, company_logo_url, raw_description')
    .eq('enrichment_status', 'done')
    .neq('url_status', 'dead')
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
        const { extractedSalary, urlStatus, companyLogoUrl, finalUrl } = await fetchJobDescription(job.url)
        const salary = toSalaryFields(extractedSalary)
        const resolvedLogo = resolveCompanyLogoUrl(job.company, job.company_logo_url, companyLogoUrl)
        const publishable = isPublishableJobRecord({
          url: finalUrl,
          urlStatus,
          companyLogoUrl: resolvedLogo,
        })
        await admin
          .from('jobs')
          .update({
            ...(salary ?? {}),
            url_status: urlStatus === 'dead' ? 'dead' : publishable ? 'live' : 'unknown',
            ...(publishable && finalUrl !== job.url ? { url: finalUrl } : {}),
            ...(!job.company_logo_url && resolvedLogo ? { company_logo_url: resolvedLogo } : {}),
            url_checked_at: new Date().toISOString(),
          })
          .eq('id', job.id)
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
    .eq('url_status', 'live')
    .eq('eligibility_status', 'eligible')
    .not('url_checked_at', 'is', null)
    .order('created_at', { ascending: false })
    .limit(20)

  if (excludedIds.length > 0) {
    query = query.not('id', 'in', `(${excludedIds.join(',')})`)
  }

  const { data: rawJobs } = await query
  const jobs = (rawJobs ?? []).filter(job => isPublishableJobRecord({
    url: job.url,
    urlStatus: job.url_status,
    companyLogoUrl: job.company_logo_url,
  }))

  const insertedLast7Days = (recentRuns ?? []).reduce(
    (sum, run) => sum + (typeof run.inserted_count === 'number' ? run.inserted_count : 0),
    0
  )

  return (
    <DiscoverClient
      initialJobs={jobs}
      crawlerStats={{
        latestRun: (latestRun as CrawlerRun | null) ?? null,
        insertedLast7Days,
      }}
    />
  )
}
