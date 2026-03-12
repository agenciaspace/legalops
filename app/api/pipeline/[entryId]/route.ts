import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { sendNotification } from '@/lib/notifications'
import type { PipelineStatus } from '@/lib/types'

const VALID_PATCH_STATUSES: PipelineStatus[] = ['researching', 'applied', 'interview', 'offer', 'discarded']

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const { entryId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.status || !VALID_PATCH_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const { data: entry, error } = await supabase
    .from('user_pipeline_entries')
    .update({ status: body.status })
    .eq('id', entryId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Get job info for notification
  const { data: jobData } = await supabase
    .from('user_pipeline_entries')
    .select('job:jobs(title, company)')
    .eq('id', entryId)
    .single()

  const job = jobData?.job as unknown as { title: string; company: string } | null

  const STATUS_PT: Record<string, string> = {
    researching: 'Pesquisando',
    applied: 'Aplicada',
    interview: 'Entrevista',
    offer: 'Oferta',
    discarded: 'Descartada',
  }

  if (job) {
    sendNotification({
      userId: user.id,
      eventType: 'status_change',
      title: `Status atualizado: ${STATUS_PT[body.status] ?? body.status}`,
      body: `${job.title} em ${job.company} foi movida para "${STATUS_PT[body.status] ?? body.status}".`,
      url: `/jobs/${entryId}`,
    }).catch(() => {})
  }

  return NextResponse.json({ entry })
}
