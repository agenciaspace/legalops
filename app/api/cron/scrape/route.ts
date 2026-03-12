import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { scrapeAllBoards, fetchJobDescription } from '@/lib/scraper'
import { enrichJob } from '@/lib/enrichment'

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const summary = { scraped: 0, inserted: 0, enriched: 0, failed: 0 }

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
    .select('id, raw_description, enrichment_attempts')
    .in('enrichment_status', ['pending', 'failed'])
    .lt('enrichment_attempts', 5)
    .limit(20)

  for (const job of pendingJobs ?? []) {
    try {
      const result = await enrichJob(job.raw_description)
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

  return NextResponse.json({ ok: true, summary })
}
