import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { sendWelcomeEmailIfNeeded, sendClubWelcomeEmailIfNeeded } from '@/lib/welcome-email'

export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const [sent, clubSent] = await Promise.all([
      sendWelcomeEmailIfNeeded(user),
      sendClubWelcomeEmailIfNeeded(user),
    ])
    return NextResponse.json({ ok: true, sent, clubSent })
  } catch (error) {
    console.error('[auth/welcome] failed to send welcome email:', error)
    return NextResponse.json({ error: 'Welcome email unavailable.' }, { status: 503 })
  }
}
