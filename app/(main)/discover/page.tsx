import { createServerSupabaseClient } from '@/lib/supabase-server'
import { DiscoverClient } from './DiscoverClient'

export default async function DiscoverPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: pipeline } = await supabase
    .from('user_pipeline_entries')
    .select('job_id')
    .eq('user_id', user!.id)

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

  const { data: jobs } = await query

  return <DiscoverClient initialJobs={jobs ?? []} />
}
