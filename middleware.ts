import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { hasActiveClubAccess } from '@/lib/community'
import { hasClubProAccess, isClubProPath } from '@/lib/club-membership'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const hostname = (forwardedHost || request.headers.get('host') || '').split(':')[0]
  const isClubDomain = hostname === 'legalops.club'
    || hostname === 'www.legalops.club'
    || hostname === 'legalops.legalops.club'

  // Keep legalops.work as the job platform while legalops.club gets its own home.
  // x-forwarded-host is honored so the Cloudflare Club proxy keeps the correct product context.
  if (isClubDomain && pathname === '/') {
    const clubUrl = request.nextUrl.clone()
    clubUrl.pathname = '/club'
    return NextResponse.rewrite(clubUrl)
  }

  // Public Bench has its own input limits and publishes only reviewed content.
  // Keep this exact path independent of Club authentication and paid access.
  if (pathname === '/club-sw.js' || /^\/club-pwa\/(manifest\.webmanifest|offline\.html|icon-(192|512|maskable)\.png)$/.test(pathname)) return NextResponse.next({ request })

  if (pathname === '/api/bench/contributions') return NextResponse.next({ request })

  let supabaseResponse = NextResponse.next({ request })
  const publicPaths = new Set(['/', '/club', '/club/about', '/club/checkout', '/cadastro', '/login', '/set-password', '/auth/confirm'])
  const isPublicPage = publicPaths.has(pathname)
    || pathname === '/bench/nubank-2026-09-17'
  const publicWebhookPaths = new Set([
    '/api/webhooks/brevo/inbound',
    '/api/webhooks/cloudflare/inbound',
  ])

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    if (publicWebhookPaths.has(pathname)) {
      return supabaseResponse
    }
    if (pathname.startsWith('/api/') && !publicWebhookPaths.has(pathname)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!isPublicPage) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
      return NextResponse.redirect(loginUrl)
    }
    return supabaseResponse
  }

  // Authenticated user on login → redirect to app
  if (pathname === '/login' || pathname === '/cadastro') {
    const requestedPath = request.nextUrl.searchParams.get('next')
    const destination = requestedPath?.startsWith('/') && !requestedPath.startsWith('//') && !requestedPath.includes('\\')
      ? requestedPath
      : isClubDomain || pathname === '/cadastro' ? '/club/entrar' : '/dashboard'
    return NextResponse.redirect(new URL(destination, request.url))
  }

  if (pathname.startsWith('/community/leaderboard')) {
    return NextResponse.redirect(new URL('/community', request.url))
  }

  const requiresClub = pathname === '/onboard'
    || ['/dashboard', '/discover', '/pipeline', '/jobs', '/settings', '/professionals'].some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))
    || ['/api/club', '/api/profile', '/api/pipeline', '/api/jobs', '/api/ai'].some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))
    || pathname === '/community' || pathname.startsWith('/community/')

  let clubAccess: { club_access_status: string | null; club_access_expires_at: string | null; club_pro_status: string | null; club_pro_expires_at: string | null } | null = null
  if (requiresClub) {
    const { data } = await supabase
      .from('community_members')
      .select('club_access_status, club_access_expires_at, club_pro_status, club_pro_expires_at')
      .eq('user_id', user.id)
      .maybeSingle()
    clubAccess = data

    if (!hasActiveClubAccess(clubAccess)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Complete seu perfil para entrar na comunidade.' }, { status: 403 })
      }
      const clubUrl = new URL('/club/entrar', request.url)
      return NextResponse.redirect(clubUrl)
    }
  }

  if (isClubProPath(pathname) && !hasClubProAccess(clubAccess)) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Este recurso faz parte do Club Pro.' }, { status: 403 })
    return NextResponse.redirect(new URL('/club#pro', request.url))
  }

  // Check onboarding completion for non-onboarding, non-API routes
  if (
    pathname !== '/onboard' &&
    !pathname.startsWith('/club/') &&
    !pathname.startsWith('/community') &&
    !pathname.startsWith('/api/') &&
    !isPublicPage
  ) {
    const { data: profile } = await supabase
      .from('account_profiles')
      .select('onboarding_completed')
      .eq('user_id', user.id)
      .single()

    if (profile && profile.onboarding_completed === false) {
      const onboardUrl = new URL('/onboard', request.url)
      onboardUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(onboardUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|brand/|api/cron).*)'],
}
