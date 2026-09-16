import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { sendWelcomeEmailIfNeeded, sendClubWelcomeEmailIfNeeded } from '@/lib/welcome-email'

const safeNextPath = (value: string | null) => {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/club/entrar'
  return value
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash')
  const code = request.nextUrl.searchParams.get('code')
  const type = request.nextUrl.searchParams.get('type')
  const nextPath = safeNextPath(request.nextUrl.searchParams.get('next'))

  if (!code && (!tokenHash || !type)) {
    return NextResponse.redirect(new URL(`/login?error=invalid_confirmation`, request.url))
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = code ? await supabase.auth.exchangeCodeForSession(code) : await supabase.auth.verifyOtp({
    token_hash: tokenHash!,
    type: type as 'email' | 'invite' | 'recovery' | 'signup' | 'email_change',
  })

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=confirmation_failed`, request.url))
  }

  if (data.user) {
    try {
      await sendWelcomeEmailIfNeeded(data.user)
      await sendClubWelcomeEmailIfNeeded(data.user)
    } catch (welcomeError) {
      console.error('[auth/confirm] welcome email failed:', welcomeError)
    }
  }

  return NextResponse.redirect(new URL(nextPath, request.url))
}
