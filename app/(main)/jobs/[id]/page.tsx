import { getUserTier } from '@/lib/email-alias-store'
import { getUserPaidAgentSettings } from '@/lib/paid-agent-settings-store'
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const [tier, agentSettings, { data: entry }] = await Promise.all([
    getUserTier(supabase, user.id),
    getUserPaidAgentSettings(supabase, user.id),
    supabase
      .from('user_pipeline_entries')
      .select('*, job:jobs(*), email_alias:user_email_aliases(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
  ])

  if (!entry) notFound()

  const [
    { data: leader },
    { data: notes },
    { data: contacts },
    { data: events },
  ] = await Promise.all([
    supabase.from('leaders').select('*').eq('entry_id', id).maybeSingle(),
    supabase.from('job_notes').select('*').eq('entry_id', id).order('created_at', { ascending: false }),
    supabase.from('contacts').select('*').eq('entry_id', id).order('created_at', { ascending: false }),
    supabase.from('application_events').select('*').eq('entry_id', id).order('event_date', { ascending: false }),
  ])

  return (
    <JobDetailClient
      entry={entry as never}
      leader={leader ?? null}
      notes={notes ?? []}
      contacts={contacts ?? []}
      events={events ?? []}
      userTier={tier}
      agentSettings={agentSettings}
    />
  )
}
