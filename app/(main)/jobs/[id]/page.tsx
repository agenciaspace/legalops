import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { JobDetailClient } from './JobDetailClient'

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: entry } = await supabase
    .from('user_pipeline_entries')
    .select('*, job:jobs(*)')
    .eq('id', id)
    .single()

  if (!entry) notFound()

  const { data: leader } = await supabase
    .from('leaders')
    .select('*')
    .eq('entry_id', id)
    .maybeSingle()

  const { data: notes } = await supabase
    .from('job_notes')
    .select('*')
    .eq('entry_id', id)
    .order('created_at', { ascending: false })

  return (
    <JobDetailClient
      entry={entry as never}
      leader={leader ?? null}
      notes={notes ?? []}
    />
  )
}
