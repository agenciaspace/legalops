import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import type { RawJob } from '@/lib/scraper'
import {
  canonicalizeJobUrl,
  dedupeJobsByUrl,
  evaluateJobEligibility,
  extractStoredLocation,
  fetchJobDescription,
  inferSourceBoardFromUrl,
  mapWithConcurrency,
  scrapeJobsWithFirecrawl,
} from '@/lib/scraper'
import {
  buildMultiSourceDiscoverySeed,
  discoverJobs,
} from '@/lib/job-discovery'
import { enrichJob } from '@/lib/enrichment'
import { researchSuggestedLeader } from '@/lib/leader-research'
import { generateClubJobAlerts } from '@/lib/club-job-matching'
import { extractSalaryFromHtml, type ExtractedSalary } from '@/lib/utils'
import { resolveCompanyLogoUrl } from '@/lib/company-logo'
import { isDirectJobUrl, isPublishableJobRecord } from '@/lib/job-publication'
import { normalizeSalaryRange, parseSalaryNumber } from '@/lib/format-salary'

function parseSalaryValues(extracted: ExtractedSalary | null): {
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
} {
  if (!extracted) return { salary_min: null, salary_max: null, salary_currency: null }

  const salary = normalizeSalaryRange(
    parseSalaryNumber(extracted.min),
    parseSalaryNumber(extracted.max),
  )

  return {
    ...salary,
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
    logosBackfilled: 0,
    failed: 0,
    alertsCreated: 0,
    discoverySource: 'none' as 'direct_ats' | 'company_site' | 'aggregator' | 'combined' | 'none',
  }

  let discoveryResult: Awaited<ReturnType<typeof discoverJobs>> | null = null
  let firecrawlCount = 0
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

    const firecrawlJobs = await scrapeJobsWithFirecrawl().catch((error: unknown) => {
      console.error('[cron] firecrawl discovery failed:', error)
      return []
    })
    firecrawlCount = firecrawlJobs.length

    const jobs = dedupeJobsByUrl([
      ...discoveryResult.jobs.map(job => ({
        title: job.title,
        url: job.url,
        source_board: job.source_board,
        company: job.company,
        location: job.location,
        salary_range: job.salary_range,
        listing_url: job.listing_url,
        posted_at: job.posted_at,
        accepts_brazil: job.accepts_brazil,
        company_logo_url: job.company_logo_url,
      })),
      ...firecrawlJobs,
    ] as RawJob[])
    summary.scraped = jobs.length
    summary.discoverySource = discoveryResult.discoverySource

    const observedAt = new Date().toISOString()
    const discoveredUrls = new Set(
      jobs.map(job => canonicalizeJobUrl(job.url).toLowerCase())
    )
    const { data: existingJobs, error: existingJobsError } = await supabase
      .from('jobs')
      .select('id, url, title, company, raw_description, location, accepts_brazil, eligibility_status, url_status, created_at, posted_at, url_checked_at, company_logo_url')

    if (existingJobsError) throw existingJobsError

    const existingByUrl = new Map<string, NonNullable<typeof existingJobs>[number]>()
    for (const existingJob of existingJobs ?? []) {
      existingByUrl.set(canonicalizeJobUrl(existingJob.url).toLowerCase(), existingJob)
    }

    const eligibilityResults = await mapWithConcurrency(existingJobs ?? [], 6, async existingJob => {
      let location = existingJob.location ?? extractStoredLocation(existingJob.raw_description)
      let rawDescription = existingJob.raw_description
      let companyLogoUrl = resolveCompanyLogoUrl(existingJob.company, existingJob.company_logo_url)

      if ((!location || !companyLogoUrl) && existingJob.url_status !== 'dead') {
        const fetched = await fetchJobDescription(existingJob.url)
        location = extractStoredLocation(fetched.description)
        rawDescription = fetched.description || rawDescription
        companyLogoUrl = resolveCompanyLogoUrl(existingJob.company, companyLogoUrl, fetched.companyLogoUrl)
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
          ...(!existingJob.company_logo_url && companyLogoUrl ? { company_logo_url: companyLogoUrl } : {}),
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
      const fetched = await fetchJobDescription(pair.discoveredJob.url)
      const resolvedLogo = resolveCompanyLogoUrl(
        pair.discoveredJob.company,
        pair.existingJob.company_logo_url,
        pair.discoveredJob.company_logo_url,
        fetched.companyLogoUrl,
      )
      const finalUrl = fetched.finalUrl
      const finalUrlOwner = existingByUrl.get(canonicalizeJobUrl(finalUrl).toLowerCase())
      const canAdoptFinalUrl = isDirectJobUrl(finalUrl) && (!finalUrlOwner || finalUrlOwner.id === pair.existingJob.id)
      const publishable = canAdoptFinalUrl && isPublishableJobRecord({
        url: finalUrl,
        urlStatus: fetched.urlStatus,
        companyLogoUrl: resolvedLogo,
      })
      const urlStatus = fetched.urlStatus === 'dead' ? 'dead' : publishable ? 'live' : 'unknown'
      const refresh: Record<string, unknown> = {
        url_status: urlStatus,
        url_checked_at: observedAt,
        last_seen_at: observedAt,
      }
      if (publishable && finalUrl !== pair.existingJob.url) {
        refresh.url = finalUrl
        refresh.source_board = inferSourceBoardFromUrl(finalUrl)
      }
      if (pair.discoveredJob.posted_at) refresh.posted_at = pair.discoveredJob.posted_at
      if (pair.discoveredJob.location) refresh.location = pair.discoveredJob.location
      const salary = parseSalaryValues(fetched.extractedSalary)
      if (salary.salary_min || salary.salary_max) Object.assign(refresh, salary)
      if (resolvedLogo) refresh.company_logo_url = resolvedLogo
      if (!pair.existingJob.company_logo_url && resolvedLogo) summary.logosBackfilled++
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

      const { job, description: pageDescription, extractedSalary, urlStatus, companyLogoUrl, finalUrl } = fetchResult.value
      const resolvedLogo = resolveCompanyLogoUrl(job.company, job.company_logo_url, companyLogoUrl)
      if (!isPublishableJobRecord({ url: finalUrl, urlStatus, companyLogoUrl: resolvedLogo })) continue

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
          url: finalUrl,
          source_board: inferSourceBoardFromUrl(finalUrl),
          raw_description: description,
          enrichment_status: 'pending',
          enrichment_attempts: 0,
          url_status: urlStatus,
          url_checked_at: observedAt,
          posted_at: job.posted_at ?? null,
          location: job.location ?? null,
          accepts_brazil: job.accepts_brazil === true,
          eligibility_status: 'eligible',
          eligibility_reason: eligibility.reason,
          last_seen_at: observedAt,
          company_logo_url: resolvedLogo,
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
      .select('id, url, company, company_logo_url')
      .neq('url_status', 'dead')
      .order('url_checked_at', { ascending: true, nullsFirst: true })
      .limit(30)

    const jobsToRecheck = (recheckJobs ?? []).filter(job =>
      !discoveredUrls.has(canonicalizeJobUrl(job.url).toLowerCase()))

    const recheckResults = await mapWithConcurrency(jobsToRecheck, 6, async job => {
      const {
        extractedSalary,
        urlStatus: fetchedUrlStatus,
        companyLogoUrl: fetchedLogoUrl,
        finalUrl,
      } = await fetchJobDescription(job.url)
      const companyLogoUrl = resolveCompanyLogoUrl(job.company, job.company_logo_url, fetchedLogoUrl)
      const finalUrlOwner = existingByUrl.get(canonicalizeJobUrl(finalUrl).toLowerCase())
      const canAdoptFinalUrl = isDirectJobUrl(finalUrl) && (!finalUrlOwner || finalUrlOwner.id === job.id)
      const publishable = canAdoptFinalUrl && isPublishableJobRecord({
        url: finalUrl,
        urlStatus: fetchedUrlStatus,
        companyLogoUrl,
      })
      const urlStatus = fetchedUrlStatus === 'dead' ? 'dead' : publishable ? 'live' : 'unknown'
      const salary = parseSalaryValues(extractedSalary)
      const { error } = await supabase
        .from('jobs')
        .update({
          url_status: urlStatus,
          url_checked_at: observedAt,
          ...(salary.salary_min || salary.salary_max ? salary : {}),
          ...(publishable && finalUrl !== job.url
            ? { url: finalUrl, source_board: inferSourceBoardFromUrl(finalUrl) }
            : {}),
          ...(!job.company_logo_url && companyLogoUrl ? { company_logo_url: companyLogoUrl } : {}),
        })
        .eq('id', job.id)
      if (error) throw error
      if (!job.company_logo_url && companyLogoUrl) summary.logosBackfilled++
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
    .limit(8)

  const enrichmentResults = await mapWithConcurrency(pendingJobs ?? [], 3, async job => {
    try {
      const result = await enrichJob({
        company: job.company,
        description: job.raw_description,
        jobTitle: job.title,
      })
      if (result) {
        if (!result.salary_min && !result.salary_max && (job.salary_min || job.salary_max)) {
          const salary = normalizeSalaryRange(job.salary_min, job.salary_max)
          result.salary_min = salary.salary_min
          result.salary_max = salary.salary_max
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
    .select('id, url, company, company_logo_url, raw_description, url_status, source_board')
    .eq('enrichment_status', 'done')
    .neq('url_status', 'dead')
    .is('salary_min', null)
    .is('salary_max', null)
    .limit(10)

  await mapWithConcurrency(jobsMissingSalary ?? [], 5, async job => {
    if (job.raw_description) {
      const extracted = extractSalaryFromHtml(job.raw_description)
      if (extracted) {
        const salary = parseSalaryValues(extracted)
        if (salary.salary_min || salary.salary_max) {
          await supabase.from('jobs').update(salary).eq('id', job.id)
          return
        }
      }
    }

    if (job.url) {
      try {
        const { extractedSalary, urlStatus: fetchedUrlStatus, companyLogoUrl: fetchedLogoUrl, finalUrl } = await fetchJobDescription(job.url)
        const companyLogoUrl = resolveCompanyLogoUrl(job.company, job.company_logo_url, fetchedLogoUrl)
        const publishable = isPublishableJobRecord({
          url: finalUrl,
          urlStatus: fetchedUrlStatus,
          companyLogoUrl,
        })
        const urlUpdate: Record<string, unknown> = {
          url_status: fetchedUrlStatus === 'dead' ? 'dead' : publishable ? 'live' : 'unknown',
          url_checked_at: new Date().toISOString(),
        }
        if (publishable && finalUrl !== job.url) {
          urlUpdate.url = finalUrl
          urlUpdate.source_board = inferSourceBoardFromUrl(finalUrl)
        }
        if (!job.company_logo_url && companyLogoUrl) urlUpdate.company_logo_url = companyLogoUrl

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
  })

  const { data: jobsMissingLeader } = await supabase
    .from('jobs')
    .select('id, company, title')
    .eq('enrichment_status', 'done')
    .is('suggested_leader_name', null)
    .limit(3)

  const leaderResults = await mapWithConcurrency(jobsMissingLeader ?? [], 3, async job => {
    try {
      const leader = await researchSuggestedLeader({
        company: job.company,
        jobTitle: job.title,
      })

      if (!leader?.suggested_leader_name) return false

      await supabase
        .from('jobs')
        .update({
          suggested_leader_name: leader.suggested_leader_name,
          suggested_leader_title: leader.suggested_leader_title,
          suggested_leader_linkedin: leader.suggested_leader_linkedin,
        })
        .eq('id', job.id)

      return true
    } catch (e) {
      console.error(`[cron] backfill leader for job ${job.id} failed:`, e)
      return false
    }
  })
  for (const result of leaderResults) {
    if (result.status === 'fulfilled' && result.value) summary.leadersBackfilled++
  }

  try {
    const alertResult = await generateClubJobAlerts()
    summary.alertsCreated = alertResult.created
  } catch (error) {
    alertError = error instanceof Error ? error.message : String(error)
    console.error('[cron] Club job alerts failed:', error)
  }

  const { error: crawlerRunError } = await supabase.from('crawler_runs').insert({
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
      firecrawlCount,
      refreshedCount: summary.refreshed,
      expiredCount: summary.expired,
      alertsCreated: summary.alertsCreated,
      ...(alertError ? { alertError } : {}),
      ...(discoveryResult?.errors?.length ? { errors: discoveryResult.errors } : {}),
    },
    started_at: startedAt,
    completed_at: new Date().toISOString(),
  })
  if (crawlerRunError) {
    console.error('[cron] failed to record crawler run:', crawlerRunError.message)
  }

  return NextResponse.json({ ok: true, summary })
}
