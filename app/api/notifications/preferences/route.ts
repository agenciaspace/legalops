import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ prefs: prefs ?? null })
}

export async function PUT(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Validate whatsapp number format if provided
  if (body.whatsapp_number && !/^\+\d{10,15}$/.test(body.whatsapp_number)) {
    return NextResponse.json({ error: 'Numero WhatsApp invalido. Use formato E.164: +5511999999999' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('notification_preferences')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const payload = {
    user_id: user.id,
    email_enabled: body.email_enabled ?? false,
    whatsapp_enabled: body.whatsapp_enabled ?? false,
    push_enabled: body.push_enabled ?? false,
    email_address: body.email_address || null,
    whatsapp_number: body.whatsapp_number || null,
    notify_new_jobs: body.notify_new_jobs ?? true,
    notify_status_change: body.notify_status_change ?? true,
    notify_interview_reminder: body.notify_interview_reminder ?? true,
    notify_follow_up_reminder: body.notify_follow_up_reminder ?? true,
    notify_weekly_summary: body.notify_weekly_summary ?? true,
    quiet_start_hour: body.quiet_start_hour ?? 22,
    quiet_end_hour: body.quiet_end_hour ?? 8,
    updated_at: new Date().toISOString(),
  }

  let result
  if (existing) {
    result = await supabase
      .from('notification_preferences')
      .update(payload)
      .eq('user_id', user.id)
      .select()
      .single()
  } else {
    result = await supabase
      .from('notification_preferences')
      .insert(payload)
      .select()
      .single()
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 })
  return NextResponse.json({ prefs: result.data })
}
