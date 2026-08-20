import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { sendWelcomeEmailIfNeeded, sendClubWelcomeEmailIfNeeded } from '@/lib/welcome-email'

const safeNextPath = (value: string | null) => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/dashboard'
  return value
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash')
  const type = request.nextUrl.searchParams.get('type')
  const nextPath = safeNextPath(request.nextUrl.searchParams.get('next'))

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL(`/login?error=invalid_confirmation`, request.url))
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
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
