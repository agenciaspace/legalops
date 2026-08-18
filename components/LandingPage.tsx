import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { LandingPageClient } from '@/components/LandingPageClient'
import type { LandingCrawlerRun, LandingJob } from '@/components/LandingPageClient'

type LandingLocale = 'pt' | 'en'

const JOB_SELECT =
  'id, title, company, url, source_board, remote_reality, salary_min, salary_max, salary_currency, url_status, url_checked_at, created_at' as const

async function fetchPublicJobs(): Promise<{ jobs: LandingJob[]; count: number }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseKey || !supabaseUrl) return { jobs: [], count: 0 }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  })

  // Discovery and URL validation are enough to publish a role. Enrichment adds
  // salary/remote metadata later and must never block a newly found live job.
  const { data, count } = await supabase
    .from('jobs')
    .select(JOB_SELECT, { count: 'exact' })
    .eq('url_status', 'live')
    .eq('eligibility_status', 'eligible')
    .not('url_checked_at', 'is', null)
    .order('created_at', { ascending: false })
    .limit(20)

  return { jobs: (data ?? []) as LandingJob[], count: count ?? 0 }
}

async function fetchLatestCrawlerRun(): Promise<LandingCrawlerRun | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseKey || !supabaseUrl) return null

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  })
  const { data } = await supabase
    .from('crawler_runs')
    .select('completed_at, discovery_source, scraped_count, inserted_count')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data as LandingCrawlerRun | null
}

export async function LandingPage({ locale }: { locale: LandingLocale }) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  const [{ jobs, count }, crawlerRun] = await Promise.all([
    fetchPublicJobs(),
    fetchLatestCrawlerRun(),
  ])

  return <LandingPageClient locale={locale} jobs={jobs} jobCount={count} crawlerRun={crawlerRun} />
}
