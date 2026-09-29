import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { clubReturnPath } from '@/lib/club-return-path'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function safeReturnPath(value: unknown) {
  if (value === '/club/entrar') return value
  if (typeof value !== 'string' || !value.startsWith('/club/entrar?')) return '/club/entrar'
  const parsed = new URL(value, 'https://legalops.club')
  const destination = parsed.searchParams.get('next')
  return destination && clubReturnPath(destination) ? `/club/entrar?next=${encodeURIComponent(destination)}` : '/club/entrar'
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!EMAIL_PATTERN.test(email) || email.length > 254) return NextResponse.json({ code: 'email_address_invalid' }, { status: 400 })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ code: 'signup_not_configured' }, { status: 503 })
  const next = safeReturnPath(body?.next)
  const origin = request.nextUrl.hostname === 'localhost' ? request.nextUrl.origin : 'https://legalops.club'
  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}` } })
  if (error) return NextResponse.json({ code: error.code ?? 'resend_failed' }, { status: error.status || 400 })
  return NextResponse.json({ ok: true })
}
