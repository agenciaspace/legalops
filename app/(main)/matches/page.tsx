import { createServerSupabaseClient } from '@/lib/supabase-server'
import { MatchesClient } from './MatchesClient'

export default async function MatchesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: matches } = await supabase
    .from('job_matches')
    .select(`
      *,
      company_job:company_jobs(
        *,
        company:company_profiles(company_name, logo_url, sector, size)
      ),
      crawled_job:jobs(*)
    `)
    .eq('user_id', user!.id)
    .neq('status', 'dismissed')
    .order('score', { ascending: false })
    .limit(30)

  const { data: profile } = await supabase
    .from('account_profiles')
    .select('areas_of_expertise, current_role, professional_type, years_experience')
    .eq('user_id', user!.id)
    .single()

  const hasProfile = !!(
    profile?.areas_of_expertise?.length &&
    profile?.current_role
  )

  return (
    <MatchesClient
      initialMatches={matches ?? []}
      hasProfile={hasProfile}
    />
  )
}
