import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { scrapeAllBoards, fetchJobDescription } from '@/lib/scraper'
import { enrichJob } from '@/lib/enrichment'
import { researchSuggestedLeader } from '@/lib/leader-research'

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const summary = { scraped: 0, inserted: 0, enriched: 0, leadersBackfilled: 0, failed: 0 }

  try {
    const jobs = await scrapeAllBoards()
    summary.scraped = jobs.length

    for (const job of jobs) {
      const description = await fetchJobDescription(job.url)
      const { error } = await supabase
        .from('jobs')
        .upsert(
          {
            title: job.title,
            company: job.company,
            url: job.url,
            source_board: job.source_board,
            raw_description: description,
            enrichment_status: 'pending',
            enrichment_attempts: 0,
          },
          { onConflict: 'url', ignoreDuplicates: true }
        )
      if (!error) summary.inserted++
    }
  } catch (e) {
    console.error('[cron] scrape step failed:', e)
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

  return NextResponse.json({ ok: true, summary })
}
