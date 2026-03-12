import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Nav } from '@/components/Nav'
import { redirect } from 'next/navigation'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: pipeline } = await supabase
    .from('user_pipeline_entries')
    .select('job_id')
    .eq('user_id', user.id)

  const excludedIds = pipeline?.map(e => e.job_id) ?? []

  let countQuery = supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('enrichment_status', 'done')

  if (excludedIds.length > 0) {
    countQuery = countQuery.not('id', 'in', `(${excludedIds.join(',')})`)
  }

  const { count } = await countQuery

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav discoverCount={count ?? 0} />
      <main className="max-w-7xl mx-auto">{children}</main>
    </div>
  )
}
