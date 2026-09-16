import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { sendWelcomeEmailIfNeeded, sendClubWelcomeEmailIfNeeded } from '@/lib/welcome-email'

export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const [accountResult, clubResult] = await Promise.allSettled([
      sendWelcomeEmailIfNeeded(user),
      sendClubWelcomeEmailIfNeeded(user),
    ])
    if (clubResult.status === 'rejected') throw clubResult.reason
    if (accountResult.status === 'rejected') console.error('[auth/welcome] account email failed:', accountResult.reason)
    return NextResponse.json({ ok: true, sent: accountResult.status === 'fulfilled' && accountResult.value, clubSent: clubResult.value })
  } catch (error) {
    console.error('[auth/welcome] failed to send welcome email:', error)
    return NextResponse.json({ error: 'Welcome email unavailable.' }, { status: 503 })
  }
}
