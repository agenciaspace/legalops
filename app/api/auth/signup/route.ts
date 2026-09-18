import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase-admin'
import { clubReturnPath } from '@/lib/club-return-path'
import { sendSignupConfirmationEmail } from '@/lib/welcome-email'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function safeReturnPath(value: unknown) {
  if (value === '/club/entrar') return value
  if (typeof value !== 'string' || !value.startsWith('/club/entrar?')) return '/club/entrar'

  const parsed = new URL(value, 'https://legalops.club')
  const destination = parsed.searchParams.get('next')
  return destination && clubReturnPath(destination)
    ? `/club/entrar?next=${encodeURIComponent(destination)}`
    : '/club/entrar'
}

function publicOrigin(request: NextRequest) {
  return request.nextUrl.hostname === 'localhost'
    ? request.nextUrl.origin
    : 'https://legalops.club'
}

function smtpConfirmationFailed(error: { code?: string; status?: number; message?: string }) {
  return error.status === 500
    && error.code === 'unexpected_failure'
    && /sending confirmation email/i.test(error.message ?? '')
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const next = safeReturnPath(body?.next)

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return NextResponse.json({ code: 'email_address_invalid' }, { status: 400 })
  }
  if (password.length < 8 || password.length > 128) {
    return NextResponse.json({ code: 'weak_password' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !publishableKey || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ code: 'signup_not_configured' }, { status: 503 })
  }

  const emailRedirectTo = `${publicOrigin(request)}/auth/confirm?next=${encodeURIComponent(next)}`
  const publicClient = createClient(supabaseUrl, publishableKey, { auth: { persistSession: false } })
  const { error: signupError } = await publicClient.auth.signUp({
    email,
    password,
    options: { emailRedirectTo },
  })

  if (!signupError) return NextResponse.json({ ok: true })
  if (!smtpConfirmationFailed(signupError)) {
    return NextResponse.json(
      { code: signupError.code ?? 'signup_failed' },
      { status: signupError.status || 400 }
    )
  }

  const admin = createAdminClient()
  const { data: generated, error: generateError } = await admin.auth.admin.generateLink({
    type: 'signup',
    email,
    password,
    options: { redirectTo: emailRedirectTo },
  })

  if (generateError || !generated.user || !generated.properties?.hashed_token) {
    console.error('[auth/signup] confirmation link generation failed:', generateError?.code ?? 'missing_link')
    return NextResponse.json({ code: generateError?.code ?? 'signup_failed' }, { status: 502 })
  }

  const confirmationLink = `${publicOrigin(request)}/auth/confirm?token_hash=${encodeURIComponent(generated.properties.hashed_token)}&type=email&next=${encodeURIComponent(next)}`

  try {
    await sendSignupConfirmationEmail({ email, confirmationLink })
  } catch (deliveryError) {
    console.error('[auth/signup] Cloudflare confirmation delivery failed:', deliveryError)
    const { error: cleanupError } = await admin.auth.admin.deleteUser(generated.user.id)
    if (cleanupError) console.error('[auth/signup] failed to remove undelivered signup:', cleanupError.code)
    return NextResponse.json({ code: 'email_delivery_failed' }, { status: 502 })
  }

  return NextResponse.json({ ok: true, fallback: true })
}
