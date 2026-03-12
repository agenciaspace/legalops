import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { generateTrackingEmail } from '@/lib/tracking-email'
import type { PipelineStatus } from '@/lib/types'

const VALID_STATUSES: PipelineStatus[] = ['researching', 'discarded']

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.job_id) {
    return NextResponse.json({ error: 'job_id required' }, { status: 400 })
  }

  const status: PipelineStatus = VALID_STATUSES.includes(body.status) ? body.status : 'researching'

  const tracking_email = generateTrackingEmail()

  const { data: entry, error } = await supabase
    .from('user_pipeline_entries')
    .insert({ user_id: user.id, job_id: body.job_id, status, tracking_email })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already in pipeline' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (status === 'researching') {
    const { data: job } = await supabase
      .from('jobs')
      .select('suggested_leader_name, suggested_leader_title, suggested_leader_linkedin')
      .eq('id', body.job_id)
      .single()

    if (job?.suggested_leader_name) {
      await supabase.from('leaders').insert({
        entry_id: entry.id,
        user_id: user.id,
        name: job.suggested_leader_name,
        title: job.suggested_leader_title,
        linkedin_url: job.suggested_leader_linkedin,
        confirmed: false,
      })
    }
  }

  return NextResponse.json({ entry })
}
