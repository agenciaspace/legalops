import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { generateTrackingEmail, generateCustomEmail } from '@/lib/tracking-email'
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

  // Tier 1: always generate random tracking email
  const tracking_email = generateTrackingEmail()

  // Tier 2: generate custom email if user has an alias
  let custom_email: string | null = null
  const [{ data: profile }, { data: job }] = await Promise.all([
    supabase.from('user_profiles').select('email_alias').eq('user_id', user.id).maybeSingle(),
    supabase.from('jobs').select('company, title, suggested_leader_name, suggested_leader_title, suggested_leader_linkedin').eq('id', body.job_id).single(),
  ])

  if (profile?.email_alias && job) {
    custom_email = generateCustomEmail(profile.email_alias, job.company, job.title)
  }

  const { data: entry, error } = await supabase
    .from('user_pipeline_entries')
    .insert({ user_id: user.id, job_id: body.job_id, status, tracking_email, custom_email })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already in pipeline' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (status === 'researching' && job?.suggested_leader_name) {
    await supabase.from('leaders').insert({
      entry_id: entry.id,
      user_id: user.id,
      name: job.suggested_leader_name,
      title: job.suggested_leader_title,
      linkedin_url: job.suggested_leader_linkedin,
      confirmed: false,
    })
  }

  return NextResponse.json({ entry })
}
