import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { CLUB_LOCALES } from '@/lib/club-locale'
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body || !/^[0-9a-f-]{36}$/i.test(body.sourceId ?? '') || !CLUB_LOCALES.includes(body.locale) || !['retry', 'report'].includes(body.action)) return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Read with the caller's RLS before using privileged queue writes.
  const { data: source } = await supabase.from('club_translation_sources').select('id,revision,status').eq('id', body.sourceId).eq('revision', body.revision).maybeSingle()
  if (!source) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const { error } = await supabase.from('club_translation_feedback').insert({ user_id: user.id, source_id: source.id, revision: source.revision, locale: body.locale, reason: body.action })
  if (error?.code === '23505') return NextResponse.json({ ok: true })
  if (error) return NextResponse.json({ error: 'feedback_unavailable' }, { status: 503 })
  if (body.action === 'retry' && source.status === 'failed') {
    const { error: retryError } = await createAdminClient().from('club_translation_sources').update({ status: 'pending', attempts: 0, next_attempt_at: new Date().toISOString() }).eq('id', source.id).eq('revision', source.revision).eq('status', 'failed')
    if (retryError) return NextResponse.json({ error: 'retry_unavailable' }, { status: 503 })
  }
  return NextResponse.json({ ok: true })
}
