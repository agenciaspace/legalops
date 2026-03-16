import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export const maxDuration = 60

/**
 * Lightweight cron endpoint that checks whether job URLs are still reachable.
 * Designed to run frequently (e.g. every 5 minutes) with small batches.
 * Uses HEAD requests to minimize bandwidth and latency.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Pick jobs that haven't been checked recently, oldest first
  // Prioritise jobs still shown on the landing page (enrichment_status = 'done', not already dead)
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, url')
    .eq('enrichment_status', 'done')
    .neq('url_status', 'dead')
    .order('url_checked_at', { ascending: true, nullsFirst: true })
    .limit(20)

  let checked = 0
  let markedDead = 0

  for (const job of jobs ?? []) {
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

      if (status === 'dead') markedDead++
      checked++
    } catch {
      // Network/timeout — mark unknown so it gets retried next cycle
      await supabase
        .from('jobs')
        .update({ url_status: 'unknown', url_checked_at: new Date().toISOString() })
        .eq('id', job.id)
      checked++
    }
  }

  return NextResponse.json({ ok: true, checked, markedDead })
}
