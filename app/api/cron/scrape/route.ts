import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { buildJobDiscoverySeed, extractBoardSlug, fetchJobDescription, scrapeAllBoards } from '@/lib/scraper'
import { enrichJob } from '@/lib/enrichment'
import { researchSuggestedLeader } from '@/lib/leader-research'
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
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const startedAt = new Date().toISOString()
  const summary = {
    scraped: 0,
    inserted: 0,
    duplicates: 0,
    enriched: 0,
    leadersBackfilled: 0,
    failed: 0,
    discoverySource: 'legacy' as 'firecrawl' | 'legacy',
    fallbackReason: null as string | null,
  }

  try {
    // Load dynamically discovered board slugs
    const { data: dynamicSlugRows } = await supabase
      .from('discovered_board_slugs')
      .select('board, slug')
    const dynamicSlugs = (dynamicSlugRows ?? []).map(r => ({ board: r.board as string, slug: r.slug as string }))

    const scrapeResult = await scrapeAllBoards(dynamicSlugs)
    const jobs = scrapeResult.jobs
    summary.scraped = jobs.length
    summary.discoverySource = scrapeResult.discoverySource
    summary.fallbackReason = scrapeResult.fallbackReason

    const uniqueUrls = Array.from(new Set(jobs.map(job => job.url)))
    const existingUrlSet = new Set<string>()

    if (uniqueUrls.length > 0) {
      const { data: existingJobs } = await supabase
        .from('jobs')
        .select('url')
        .in('url', uniqueUrls)

      for (const existingJob of existingJobs ?? []) {
        if (typeof existingJob.url === 'string') {
          existingUrlSet.add(existingJob.url.toLowerCase())
        }
      }
    }

    const newJobs = jobs.filter(job => !existingUrlSet.has(job.url.toLowerCase()))
    summary.duplicates = jobs.length - newJobs.length

    for (const job of newJobs) {
      const { description: pageDescription, extractedSalary, httpStatus } = await fetchJobDescription(job.url)
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

      const urlStatus = httpStatus === null ? 'unknown'
        : (httpStatus >= 200 && httpStatus < 400) ? 'live'
        : 'dead'

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
          url_checked_at: new Date().toISOString(),
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
    // Discover new board slugs from scraped job URLs
    const newSlugs = new Map<string, { board: string; slug: string; url: string }>()
    for (const job of jobs) {
      const parsed = extractBoardSlug(job.url)
      if (parsed) {
        const key = `${parsed.board}/${parsed.slug}`
        if (!newSlugs.has(key)) newSlugs.set(key, { ...parsed, url: job.url })
      }
    }
    for (const { board, slug, url } of Array.from(newSlugs.values())) {
      await supabase
        .from('discovered_board_slugs')
        .upsert({ board, slug, discovered_from: url }, { onConflict: 'board,slug', ignoreDuplicates: true })
    }
  } catch (e) {
    console.error('[cron] scrape step failed:', e)
    summary.failed++
  }

  const { data: pendingJobs } = await supabase
    .from('jobs')
    .select('id, company, title, raw_description, enrichment_attempts, salary_min, salary_max, salary_currency')
    .in('enrichment_status', ['pending', 'failed'])
    .lt('enrichment_attempts', 5)
    .limit(20)

  for (const job of pendingJobs ?? []) {
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
        await supabase
          .from('jobs')
          .update({ ...result, enrichment_status: 'done' })
          .eq('id', job.id)
        summary.enriched++
      } else {
        await supabase
          .from('jobs')
          .update({ enrichment_status: 'failed', enrichment_attempts: job.enrichment_attempts + 1 })
          .eq('id', job.id)
        summary.failed++
      }
    } catch (e) {
      console.error(`[cron] enrich job ${job.id} failed:`, e)
      await supabase
        .from('jobs')
        .update({ enrichment_status: 'failed', enrichment_attempts: job.enrichment_attempts + 1 })
        .eq('id', job.id)
      summary.failed++
    }
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
        const { extractedSalary, httpStatus } = await fetchJobDescription(job.url)

        // Update URL status based on fresh response
        const freshUrlStatus = httpStatus === null ? 'unknown'
          : (httpStatus >= 200 && httpStatus < 400) ? 'live'
          : 'dead'
        const urlUpdate: Record<string, unknown> = {
          url_status: freshUrlStatus,
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

  // URL health check: verify if existing jobs are still reachable
  // Uses HEAD requests to minimize bandwidth; checks oldest-verified first
  const { data: jobsToCheck } = await supabase
    .from('jobs')
    .select('id, url')
    .eq('enrichment_status', 'done')
    .neq('url_status', 'dead')
    .order('url_checked_at', { ascending: true, nullsFirst: true })
    .limit(30)

  for (const job of jobsToCheck ?? []) {
    try {
      const response = await fetch(job.url, {
        method: 'HEAD',
        headers: { 'User-Agent': 'LegalOpsCRM/1.0' },
        signal: AbortSignal.timeout(10_000),
        redirect: 'follow',
      })
      const status = response.ok ? 'live' : 'dead'
      await supabase
        .from('jobs')
        .update({ url_status: status, url_checked_at: new Date().toISOString() })
        .eq('id', job.id)
    } catch {
      // Network/timeout error — mark as unknown, will retry next cycle
      await supabase
        .from('jobs')
        .update({ url_status: 'unknown', url_checked_at: new Date().toISOString() })
        .eq('id', job.id)
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
      fallbackReason: summary.fallbackReason,
    },
    started_at: startedAt,
    completed_at: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true, summary })
}
