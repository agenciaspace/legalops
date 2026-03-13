import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { buildJobDiscoverySeed, fetchJobDescription, scrapeAllBoards } from '@/lib/scraper'
import { enrichJob } from '@/lib/enrichment'
import { researchSuggestedLeader } from '@/lib/leader-research'

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
    const scrapeResult = await scrapeAllBoards()
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
      const pageDescription = await fetchJobDescription(job.url)
      const discoverySeed = buildJobDiscoverySeed(job)
      const description = [discoverySeed, pageDescription]
        .filter(Boolean)
        .join('\n\n')
        .slice(0, 8000)
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
  } catch (e) {
    console.error('[cron] scrape step failed:', e)
    summary.failed++
  }

  const { data: pendingJobs } = await supabase
    .from('jobs')
    .select('id, company, title, raw_description, enrichment_attempts')
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
