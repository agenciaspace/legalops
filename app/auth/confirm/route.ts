import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { sendWelcomeEmailIfNeeded, sendClubWelcomeEmailIfNeeded } from '@/lib/welcome-email'
import { authNextPath } from '@/lib/auth-login'

const safeNextPath = (value: string | null) => {
  return authNextPath(value, '/club/entrar')
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash')
  const code = request.nextUrl.searchParams.get('code')
  const type = request.nextUrl.searchParams.get('type')
  const nextPath = safeNextPath(request.nextUrl.searchParams.get('next'))
  const failure = (reason: string) => {
    const url = new URL('/login', request.url)
    url.searchParams.set('error', reason)
    const destination = nextPath.startsWith('/set-password?')
      ? safeNextPath(new URL(nextPath, request.url).searchParams.get('next')) : nextPath
    url.searchParams.set('next', destination)
    return NextResponse.redirect(url)
  }

  if (!code && (!tokenHash || !type || !['email', 'invite', 'recovery', 'signup', 'magiclink', 'email_change'].includes(type))) {
    return failure('invalid_confirmation')
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = code ? await supabase.auth.exchangeCodeForSession(code) : await supabase.auth.verifyOtp({
    token_hash: tokenHash!,
    type: type as 'email' | 'invite' | 'recovery' | 'signup' | 'magiclink' | 'email_change',
  })

  if (error) {
    return failure('confirmation_failed')
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
