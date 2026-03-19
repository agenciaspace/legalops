import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { LandingPageClient } from '@/components/LandingPageClient'
import type { LandingJob } from '@/components/LandingPageClient'

type LandingLocale = 'pt' | 'en'

const JOB_SELECT =
  'id, title, company, url, remote_reality, salary_min, salary_max, salary_currency, url_status, created_at' as const

async function fetchPublicJobs(): Promise<{ jobs: LandingJob[]; count: number }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Prefer service role key (bypasses RLS), fall back to anon key (needs public policy)
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseKey || !supabaseUrl) return { jobs: [], count: 0 }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  })

  // Try enriched jobs first
  const { data, count } = await supabase
    .from('jobs')
    .select(JOB_SELECT, { count: 'exact' })
    .eq('enrichment_status', 'done')
    .neq('url_status', 'dead')
    .order('created_at', { ascending: false })
    .limit(20)

  if (data && data.length > 0) {
    return { jobs: data as LandingJob[], count: count ?? 0 }
  }

  // Fallback: show any jobs regardless of enrichment status
  const { data: fallbackData, count: fallbackCount } = await supabase
    .from('jobs')
    .select(JOB_SELECT, { count: 'exact' })
    .neq('url_status', 'dead')
    .order('created_at', { ascending: false })
    .limit(20)

  return { jobs: (fallbackData ?? []) as LandingJob[], count: fallbackCount ?? 0 }
}

export async function LandingPage({ locale }: { locale: LandingLocale }) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  const { jobs, count } = await fetchPublicJobs()

  return <LandingPageClient locale={locale} jobs={jobs} jobCount={count} />
}
