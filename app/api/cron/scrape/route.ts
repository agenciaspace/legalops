import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import {
  buildJobDiscoverySeed,
  canonicalizeJobUrl,
  fetchJobDescription,
  mapWithConcurrency,
  scrapeAllBoards,
  shouldExpireUnseenJob,
} from '@/lib/scraper'
import { enrichJob } from '@/lib/enrichment'
import { researchSuggestedLeader } from '@/lib/leader-research'
import { generateClubJobAlerts } from '@/lib/club-job-matching'
import { extractSalaryFromHtml, type ExtractedSalary } from '@/lib/utils'

function parseSalaryValues(extracted: ExtractedSalary | null): {
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
} {
  if (!extracted) return { salary_min: null, salary_max: null, salary_currency: null }

  const parseNum = (val: string | null): number | null => {
    if (!val) return null
    // Remove currency symbols and whitespace
    let cleaned = val.replace(/[R$€£₹¥A$C$S$HK$NZ$CHFkrzł₪,\s]/g, '')
    // Handle "k" notation (e.g. "120k" → 120000)
    if (/k$/i.test(val.replace(/\s+/g, ''))) {
      cleaned = cleaned.replace(/k$/i, '')
      const num = parseFloat(cleaned)
      return isNaN(num) ? null : Math.round(num * 1000)
    }
    // Handle Brazilian notation (dots as thousands separator)
    if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
      cleaned = cleaned.replace(/\./g, '')
    }
    const num = parseFloat(cleaned)
    return isNaN(num) ? null : Math.round(num)
  }

  return {
    salary_min: parseNum(extracted.min),
    salary_max: parseNum(extracted.max),
    salary_currency: extracted.currency ?? null,
  }
}

export const maxDuration = 180

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const startedAt = new Date().toISOString()
  const summary = {
    scraped: 0,
    inserted: 0,
    duplicates: 0,
    refreshed: 0,
    expired: 0,
    enriched: 0,
    leadersBackfilled: 0,
    failed: 0,
    alertsCreated: 0,
    discoverySource: 'combined' as 'firecrawl' | 'legacy' | 'combined',
  }

  let scrapeResult: Awaited<ReturnType<typeof scrapeAllBoards>> | null = null
  let alertError: string | null = null

  try {
    scrapeResult = await scrapeAllBoards()
    const jobs = scrapeResult.jobs
    summary.scraped = jobs.length
    summary.discoverySource = scrapeResult.discoverySource

    const observedAt = new Date().toISOString()
    const discoveredUrls = new Set(
      jobs.map(job => canonicalizeJobUrl(job.url).toLowerCase())
    )
    const { data: existingJobs, error: existingJobsError } = await supabase
      .from('jobs')
      .select('id, url, created_at, posted_at, url_checked_at')

    if (existingJobsError) throw existingJobsError

    const existingByUrl = new Map<string, NonNullable<typeof existingJobs>[number]>()
    for (const existingJob of existingJobs ?? []) {
      existingByUrl.set(canonicalizeJobUrl(existingJob.url).toLowerCase(), existingJob)
    }

    const seenExistingJobs = jobs.flatMap(job => {
      const existingJob = existingByUrl.get(canonicalizeJobUrl(job.url).toLowerCase())
      return existingJob ? [{ existingJob, discoveredJob: job }] : []
    })

    const refreshResults = await mapWithConcurrency(seenExistingJobs, 6, async pair => {
      const { urlStatus } = await fetchJobDescription(pair.discoveredJob.url)
      const refresh: Record<string, unknown> = {
        url_status: urlStatus,
        url_checked_at: observedAt,
      }
      if (pair.discoveredJob.posted_at) refresh.posted_at = pair.discoveredJob.posted_at

      const { error } = await supabase
        .from('jobs')
        .update(refresh)
        .eq('id', pair.existingJob.id)
      if (error) throw error
    })

    for (const result of refreshResults) {
      if (result.status === 'fulfilled') summary.refreshed++
      else summary.failed++
    }

    const newJobs = jobs.filter(job =>
      !existingByUrl.has(canonicalizeJobUrl(job.url).toLowerCase()))
    summary.duplicates = seenExistingJobs.length

    const fetchResults = await mapWithConcurrency(newJobs, 5, async job => ({
      job,
      ...await fetchJobDescription(job.url),
    }))

    for (const fetchResult of fetchResults) {
      if (fetchResult.status === 'rejected') {
        summary.failed++
        continue
      }

      const { job, description: pageDescription, extractedSalary, urlStatus } = fetchResult.value
      const discoverySeed = buildJobDiscoverySeed(job)
      const description = [discoverySeed, pageDescription]
        .filter(Boolean)
        .join('\n\n')
        .slice(0, 8000)

      // Pre-populate salary from HTML extraction so it's available even if AI enrichment fails
      let salaryData = parseSalaryValues(extractedSalary)

      // Fallback: parse salary_range from discovery source (Firecrawl/API) when HTML extraction found nothing
      if (!salaryData.salary_min && !salaryData.salary_max && job.salary_range) {
        const rangeSalary = extractSalaryFromHtml(job.salary_range)
        if (rangeSalary) {
          salaryData = parseSalaryValues(rangeSalary)
        }
      }

      const { error } = await supabase
        .from('jobs')
        .insert({
          title: job.title,
          company: job.company,
          url: job.url,
          source_board: job.source_board,
          raw_description: description,
          enrichment_status: 'pending',
          enrichment_attempts: 0,
          url_status: urlStatus,
          url_checked_at: observedAt,
          posted_at: job.posted_at ?? null,
          ...salaryData,
        })

      if (!error) {
        summary.inserted++
        continue
      }

      if (error.code === '23505') {
        summary.duplicates++
        continue
      }

      console.error(`[cron] insert job ${job.url} failed:`, error)
      summary.failed++
    }

    // Firecrawl is the broad inventory source. Only retire unseen jobs when it
    // returned a non-empty result, so a provider outage cannot empty the feed.
    if (scrapeResult.firecrawlSucceeded && scrapeResult.firecrawlCount > 0) {
      const staleJobs = (existingJobs ?? []).filter(job =>
        shouldExpireUnseenJob(job, discoveredUrls, new Date(observedAt)))
      const expireResults = await mapWithConcurrency(staleJobs, 6, async job => {
        const { error } = await supabase
          .from('jobs')
          .update({ url_status: 'dead', url_checked_at: observedAt })
          .eq('id', job.id)
        if (error) throw error
      })

      for (const result of expireResults) {
        if (result.status === 'fulfilled') summary.expired++
        else summary.failed++
      }
    }
  } catch (e) {
    console.error('[cron] scrape step failed:', e)
    summary.failed++
  }

  const { data: pendingJobs } = await supabase
    .from('jobs')
    .select('id, company, title, raw_description, enrichment_attempts, salary_min, salary_max, salary_currency, posted_at')
    .in('enrichment_status', ['pending', 'failed'])
    .lt('enrichment_attempts', 5)
    .order('created_at', { ascending: false })
    .limit(20)

  const enrichmentResults = await mapWithConcurrency(pendingJobs ?? [], 3, async job => {
    try {
      const result = await enrichJob({
        company: job.company,
        description: job.raw_description,
        jobTitle: job.title,
      })
      if (result) {
        // Preserve HTML-extracted salary when AI enrichment returns null
        if (!result.salary_min && !result.salary_max && (job.salary_min || job.salary_max)) {
          result.salary_min = job.salary_min
          result.salary_max = job.salary_max
          result.salary_currency = job.salary_currency
        }
        if (!result.posted_at && job.posted_at) result.posted_at = job.posted_at
        await supabase
          .from('jobs')
          .update({ ...result, enrichment_status: 'done' })
          .eq('id', job.id)
        return 'enriched' as const
      } else {
        await supabase
          .from('jobs')
          .update({ enrichment_status: 'failed', enrichment_attempts: job.enrichment_attempts + 1 })
          .eq('id', job.id)
        return 'failed' as const
      }
    } catch (e) {
      console.error(`[cron] enrich job ${job.id} failed:`, e)
      await supabase
        .from('jobs')
        .update({ enrichment_status: 'failed', enrichment_attempts: job.enrichment_attempts + 1 })
        .eq('id', job.id)
      return 'failed' as const
    }
  })

  for (const result of enrichmentResults) {
    if (result.status === 'fulfilled' && result.value === 'enriched') summary.enriched++
    else summary.failed++
  }

  // Backfill salary for existing jobs that have no salary_min/salary_max
  // First try raw_description, then re-fetch the job page for fresh HTML extraction
  // Skip jobs with dead URLs to avoid wasting requests
  const { data: jobsMissingSalary } = await supabase
    .from('jobs')
    .select('id, url, raw_description, url_status')
    .eq('enrichment_status', 'done')
    .neq('url_status', 'dead')
    .is('salary_min', null)
    .is('salary_max', null)
    .limit(20)

  for (const job of jobsMissingSalary ?? []) {
    // Strategy 1: try extracting from stored raw_description
    if (job.raw_description) {
      const extracted = extractSalaryFromHtml(job.raw_description)
      if (extracted) {
        const salary = parseSalaryValues(extracted)
        if (salary.salary_min || salary.salary_max) {
          await supabase.from('jobs').update(salary).eq('id', job.id)
          continue
        }
      }
    }

    // Strategy 2: re-fetch the job page and extract salary from fresh HTML
    if (job.url) {
      try {
        const { extractedSalary, urlStatus } = await fetchJobDescription(job.url)

        // Update URL status based on the application page itself.
        const urlUpdate: Record<string, unknown> = {
          url_status: urlStatus,
          url_checked_at: new Date().toISOString(),
        }

        const salary = parseSalaryValues(extractedSalary)
        if (salary.salary_min || salary.salary_max) {
          await supabase.from('jobs').update({ ...salary, ...urlUpdate }).eq('id', job.id)
        } else {
          await supabase.from('jobs').update(urlUpdate).eq('id', job.id)
        }
      } catch {
        // Fetch failed, skip
      }
    }
  }

  const { data: jobsMissingLeader } = await supabase
    .from('jobs')
    .select('id, company, title')
    .eq('enrichment_status', 'done')
    .is('suggested_leader_name', null)
    .limit(10)

  for (const job of jobsMissingLeader ?? []) {
    try {
      const leader = await researchSuggestedLeader({
        company: job.company,
        jobTitle: job.title,
      })

      if (!leader?.suggested_leader_name) continue

      await supabase
        .from('jobs')
        .update({
          suggested_leader_name: leader.suggested_leader_name,
          suggested_leader_title: leader.suggested_leader_title,
          suggested_leader_linkedin: leader.suggested_leader_linkedin,
        })
        .eq('id', job.id)

      summary.leadersBackfilled++
    } catch (e) {
      console.error(`[cron] backfill leader for job ${job.id} failed:`, e)
    }
  }

  try {
    const alertResult = await generateClubJobAlerts()
    summary.alertsCreated = alertResult.created
  } catch (error) {
    alertError = error instanceof Error ? error.message : String(error)
    console.error('[cron] Club job alerts failed:', error)
  }

  await supabase.from('crawler_runs').insert({
    provider: 'firecrawl',
    discovery_source: summary.discoverySource,
    scraped_count: summary.scraped,
    inserted_count: summary.inserted,
    duplicate_count: summary.duplicates,
    enriched_count: summary.enriched,
    failed_count: summary.failed,
    leaders_backfilled: summary.leadersBackfilled,
    notes: {
      firecrawlCount: scrapeResult?.firecrawlCount ?? 0,
      legacyCount: scrapeResult?.legacyCount ?? 0,
      firecrawlSucceeded: scrapeResult?.firecrawlSucceeded ?? false,
      legacySucceeded: scrapeResult?.legacySucceeded ?? false,
      refreshedCount: summary.refreshed,
      expiredCount: summary.expired,
      alertsCreated: summary.alertsCreated,
      ...(alertError ? { alertError } : {}),
      ...(scrapeResult?.errors?.length ? { errors: scrapeResult.errors } : {}),
    },
    started_at: startedAt,
    completed_at: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true, summary })
}
