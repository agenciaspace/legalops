import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { hasActiveClubAccess } from '@/lib/community'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = (request.headers.get('host') ?? '').split(':')[0]
  const isClubDomain = hostname === 'legalops.club'
    || hostname === 'www.legalops.club'
    || hostname === 'legalops.legalops.club'

  // Keep legalops.work as the job platform while legalops.club gets its own home.
  if (isClubDomain && pathname === '/') {
    const clubUrl = request.nextUrl.clone()
    clubUrl.pathname = '/club'
    return NextResponse.rewrite(clubUrl)
  }

  let supabaseResponse = NextResponse.next({ request })
  const publicPaths = new Set(['/', '/club', '/club/about', '/en', '/login', '/manifesto', '/pricing', '/for-employers'])

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
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!publicPaths.has(pathname)) {
      const loginUrl = new URL('/login', request.url)
      if (pathname.startsWith('/community')) {
        loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
      }
      return NextResponse.redirect(loginUrl)
    }
    return supabaseResponse
  }

  // Authenticated user on login → redirect to app
  if (pathname === '/login') {
    const requestedPath = request.nextUrl.searchParams.get('next')
    const destination = requestedPath?.startsWith('/') && !requestedPath.startsWith('//')
      ? requestedPath
      : isClubDomain ? '/community' : '/dashboard'
    return NextResponse.redirect(new URL(destination, request.url))
  }

  if (pathname.startsWith('/community/leaderboard')) {
    return NextResponse.redirect(new URL('/community', request.url))
  }

  // Check onboarding completion for non-onboarding, non-API routes
  if (
    pathname !== '/onboard' &&
    !pathname.startsWith('/api/') &&
    !publicPaths.has(pathname)
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

  // The root feed contains the public preview. Every deeper Club route is paid-only.
  if (pathname.startsWith('/community/')) {
    const { data: clubAccess } = await supabase
      .from('community_members')
      .select('club_access_status, club_access_expires_at')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!hasActiveClubAccess(clubAccess)) {
      const upgradeUrl = new URL('/community', request.url)
      upgradeUrl.searchParams.set('upgrade', '1')
      return NextResponse.redirect(upgradeUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/cron).*)'],
}
