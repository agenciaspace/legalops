import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { LandingPageClient } from '@/components/LandingPageClient'
import type { LandingJob } from '@/components/LandingPageClient'

type LandingLocale = 'pt' | 'en'

async function fetchPublicJobs(): Promise<{ jobs: LandingJob[]; count: number }> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceRoleKey || !supabaseUrl) return { jobs: [], count: 0 }

  const supabase = createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  })

  const { data, count } = await supabase
    .from('jobs')
    .select('id, title, company, url, remote_reality, salary_min, salary_max, salary_currency, url_status, created_at', { count: 'exact' })
    .eq('enrichment_status', 'done')
    .order('created_at', { ascending: false })
    .limit(20)

  return { jobs: (data ?? []) as LandingJob[], count: count ?? 0 }
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
