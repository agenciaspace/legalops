import { NextRequest, NextResponse } from 'next/server'
import type { CrawlerRun } from '@/lib/crawler-runs'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const before = req.nextUrl.searchParams.get('before')

  const { data: pipeline } = await supabase
    .from('user_pipeline_entries')
    .select('job_id')
    .eq('user_id', user.id)

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
  if (before) {
    query = query.lt('created_at', before)
  }

  const [jobsResult, latestRunResult, recentRunsResult] = await Promise.all([
    query,
    supabase
      .from('crawler_runs')
      .select('*')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('crawler_runs')
      .select('inserted_count')
      .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  const insertedLast7Days = (recentRunsResult.data ?? []).reduce(
    (sum, run) => sum + (typeof run.inserted_count === 'number' ? run.inserted_count : 0),
    0
  )

  return NextResponse.json({
    jobs: jobsResult.data ?? [],
    crawlerStats: {
      latestRun: (latestRunResult.data as CrawlerRun | null) ?? null,
      insertedLast7Days,
    },
  })
}
