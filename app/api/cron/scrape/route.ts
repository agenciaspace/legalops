import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import {
  canonicalizeJobUrl,
  evaluateJobEligibility,
  extractStoredLocation,
  fetchJobDescription,
  mapWithConcurrency,
} from '@/lib/scraper'
import {
  buildMultiSourceDiscoverySeed,
  discoverJobs,
} from '@/lib/job-discovery'
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
    discoverySource: 'none' as 'direct_ats' | 'company_site' | 'aggregator' | 'combined' | 'none',
  }

  let discoveryResult: Awaited<ReturnType<typeof discoverJobs>> | null = null
  let alertError: string | null = null

  const readBackendSecret = async (name: string): Promise<string | null> => {
    const { data, error } = await supabase.rpc('get_backend_secret', { secret_name: name })
    if (error) {
      console.error(`[cron] secret ${name} unavailable:`, error.message)
      return null
    }
    return typeof data === 'string' && data.trim() ? data.trim() : null
  }

  try {
    const [joobleApiKey, adzunaAppId, adzunaAppKey] = await Promise.all([
      readBackendSecret('JOOBLE_API_KEY'),
      readBackendSecret('ADZUNA_APP_ID'),
      readBackendSecret('ADZUNA_APP_KEY'),
    ])

    discoveryResult = await discoverJobs({
      joobleApiKey,
      adzunaAppId,
      adzunaAppKey,
    })

    const jobs = discoveryResult.jobs
    summary.scraped = jobs.length
    summary.discoverySource = discoveryResult.discoverySource

    const observedAt = new Date().toISOString()
    const discoveredUrls = new Set(
      jobs.map(job => canonicalizeJobUrl(job.url).toLowerCase())
    )
    const { data: existingJobs, error: existingJobsError } = await supabase
      .from('jobs')
      .select('id, url, title, raw_description, location, accepts_brazil, eligibility_status, url_status, created_at, posted_at, url_checked_at')

    if (existingJobsError) throw existingJobsError

    const existingByUrl = new Map<string, NonNullable<typeof existingJobs>[number]>()
    for (const existingJob of existingJobs ?? []) {
      existingByUrl.set(canonicalizeJobUrl(existingJob.url).toLowerCase(), existingJob)
    }

    const eligibilityResults = await mapWithConcurrency(existingJobs ?? [], 6, async existingJob => {
      let location = existingJob.location ?? extractStoredLocation(existingJob.raw_description)
      let rawDescription = existingJob.raw_description

      if (!location && existingJob.url_status !== 'dead') {
        const fetched = await fetchJobDescription(existingJob.url)
        location = extractStoredLocation(fetched.description)
        rawDescription = fetched.description || rawDescription
      }

      const eligibility = evaluateJobEligibility({
        title: existingJob.title,
        location,
        accepts_brazil: existingJob.accepts_brazil === true,
      })

      const { error } = await supabase
        .from('jobs')
        .update({
          ...(location ? { location } : {}),
          ...(rawDescription !== existingJob.raw_description ? { raw_description: rawDescription } : {}),
          eligibility_status: eligibility.eligible ? 'eligible' : 'rejected',
          eligibility_reason: eligibility.reason,
        })
        .eq('id', existingJob.id)

      if (error) throw error
    })

    for (const result of eligibilityResults) {
      if (result.status === 'rejected') summary.failed++
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
        last_seen_at: observedAt,
      }
      if (pair.discoveredJob.posted_at) refresh.posted_at = pair.discoveredJob.posted_at
      if (pair.discoveredJob.location) refresh.location = pair.discoveredJob.location
      refresh.accepts_brazil = pair.discoveredJob.accepts_brazil === true
      const eligibility = evaluateJobEligibility(pair.discoveredJob)
      refresh.eligibility_status = eligibility.eligible ? 'eligible' : 'rejected'
      refresh.eligibility_reason = eligibility.reason

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
      if (urlStatus === 'dead') continue

      const discoverySeed = buildMultiSourceDiscoverySeed(job)
      const description = [discoverySeed, pageDescription]
        .filter(Boolean)
        .join('\n\n')
        .slice(0, 8000)

      let salaryData = parseSalaryValues(extractedSalary)
      if (!salaryData.salary_min && !salaryData.salary_max && job.salary_range) {
        const rangeSalary = extractSalaryFromHtml(job.salary_range)
        if (rangeSalary) salaryData = parseSalaryValues(rangeSalary)
      }

      const eligibility = evaluateJobEligibility(job)
      if (!eligibility.eligible) continue

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
          // A current ATS/API/JobPosting result is itself a strong live signal.
          // Only an explicit dead page overrides it.
          url_status: 'live',
          url_checked_at: observedAt,
          posted_at: job.posted_at ?? null,
          location: job.location ?? null,
          accepts_brazil: job.accepts_brazil === true,
          eligibility_status: 'eligible',
          eligibility_reason: eligibility.reason,
          last_seen_at: observedAt,
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

    // Revalidate older live/unknown jobs directly instead of assuming that one
    // discovery provider has a complete inventory of the market.
    const { data: recheckJobs } = await supabase
      .from('jobs')
      .select('id, url')
      .neq('url_status', 'dead')
      .order('url_checked_at', { ascending: true, nullsFirst: true })
      .limit(30)

    const jobsToRecheck = (recheckJobs ?? []).filter(job =>
      !discoveredUrls.has(canonicalizeJobUrl(job.url).toLowerCase()))

    const recheckResults = await mapWithConcurrency(jobsToRecheck, 6, async job => {
      const { urlStatus } = await fetchJobDescription(job.url)
      const { error } = await supabase
        .from('jobs')
        .update({
          url_status: urlStatus,
          url_checked_at: observedAt,
        })
        .eq('id', job.id)
      if (error) throw error
      return urlStatus
    })

    for (const result of recheckResults) {
      if (result.status === 'fulfilled' && result.value === 'dead') summary.expired++
      else if (result.status === 'rejected') summary.failed++
    }
  } catch (e) {
    console.error('[cron] discovery step failed:', e)
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

  const { data: jobsMissingSalary } = await supabase
    .from('jobs')
    .select('id, url, raw_description, url_status')
    .eq('enrichment_status', 'done')
    .neq('url_status', 'dead')
    .is('salary_min', null)
    .is('salary_max', null)
    .limit(20)

  for (const job of jobsMissingSalary ?? []) {
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

    if (job.url) {
      try {
        const { extractedSalary, urlStatus } = await fetchJobDescription(job.url)
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
    provider: 'multi_source',
    discovery_source: summary.discoverySource,
    scraped_count: summary.scraped,
    inserted_count: summary.inserted,
    duplicate_count: summary.duplicates,
    enriched_count: summary.enriched,
    failed_count: summary.failed,
    leaders_backfilled: summary.leadersBackfilled,
    notes: {
      sourceCounts: discoveryResult?.counts ?? {},
      sourceSucceeded: discoveryResult?.succeeded ?? {},
      refreshedCount: summary.refreshed,
      expiredCount: summary.expired,
      alertsCreated: summary.alertsCreated,
      ...(alertError ? { alertError } : {}),
      ...(discoveryResult?.errors?.length ? { errors: discoveryResult.errors } : {}),
    },
    started_at: startedAt,
    completed_at: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true, summary })
}