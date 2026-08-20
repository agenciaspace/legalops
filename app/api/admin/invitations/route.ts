import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendClubWelcomeEmailIfNeeded } from '@/lib/welcome-email'

function getAdminEmails() {
  return new Set(
    (process.env.LEGALOPS_ADMIN_EMAILS ?? '')
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(Boolean)
  )
}

function getRequestOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  return forwardedHost ? `${forwardedProto}://${forwardedHost}` : request.nextUrl.origin
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmails = getAdminEmails()

  if (!user?.email || adminEmails.size === 0) {
    return NextResponse.json({ error: 'Invitation administration is not configured.' }, { status: 503 })
  }

  if (!adminEmails.has(user.email.toLowerCase())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const redirectTo = `${getRequestOrigin(request)}/auth/confirm?next=${encodeURIComponent('/community')}`
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo })

  if (inviteError || !invited.user) {
    return NextResponse.json(
      { error: inviteError?.message ?? 'Could not create invitation.' },
      { status: 502 }
    )
  }

  const { error: memberError } = await admin
    .from('community_members')
    .upsert({
      user_id: invited.user.id,
      display_name: email.split('@')[0],
      club_plan: 'free',
      club_access_status: 'complimentary',
    }, { onConflict: 'user_id' })

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 })
  }

  try {
    await sendClubWelcomeEmailIfNeeded({ id: invited.user.id, email: invited.user.email })
  } catch (welcomeError) {
    console.error('[invitations] club welcome email failed:', welcomeError)
  }

  return NextResponse.json({ ok: true, email, user_id: invited.user.id }, { status: 201 })
}
