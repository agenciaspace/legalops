import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { LandingPageClient } from '@/components/LandingPageClient'
import type { LandingJob } from '@/components/LandingPageClient'

type LandingLocale = 'pt' | 'en'

async function fetchPublicJobs(): Promise<LandingJob[]> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceRoleKey || !supabaseUrl) return []

  const supabase = createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  })

  const { data } = await supabase
    .from('jobs')
    .select('id, title, company, url, remote_reality, salary_min, salary_max, salary_currency, url_status, created_at')
    .eq('enrichment_status', 'done')
    .order('created_at', { ascending: false })
    .limit(20)

  return (data ?? []) as LandingJob[]
}

export async function LandingPage({ locale }: { locale: LandingLocale }) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  const jobs = await fetchPublicJobs()

  return <LandingPageClient locale={locale} jobs={jobs} />
}
