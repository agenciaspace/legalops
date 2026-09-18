import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { CLUB_LOCALES, CLUB_LOCALE_COOKIE, normalizeClubTimezone, type ClubLocale } from '@/lib/club-locale'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body || !CLUB_LOCALES.includes(body.locale as ClubLocale)) return NextResponse.json({ error: 'invalid_locale' }, { status: 400 })
  const country = typeof body.country === 'string' ? body.country.trim().toUpperCase() : undefined
  if (country && !/^[A-Z]{2}$/.test(country)) return NextResponse.json({ error: 'invalid_country' }, { status: 400 })
  if (body.timezone && normalizeClubTimezone(body.timezone) !== body.timezone) return NextResponse.json({ error: 'invalid_timezone' }, { status: 400 })
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const fields = { preferred_locale: body.locale, ...(country !== undefined ? { country_code: country || null } : {}), ...(body.timezone ? { timezone: body.timezone } : {}) }
  let query = supabase.from('account_profiles').update(fields).eq('user_id', user.id)
  if (body.initialize === true) query = query.is('preferred_locale', null)
  const { data: changed, error } = await query.select('user_id')
  if (error) return NextResponse.json({ error: 'preferences_unavailable' }, { status: 503 })
  if (changed?.length) {
    const { error: metadataError } = await supabase.auth.updateUser({ data: { locale: body.locale } })
    if (metadataError) return NextResponse.json({ error: 'preferences_unavailable' }, { status: 503 })
  }
  const response = NextResponse.json({ ok: true })
  response.cookies.set(CLUB_LOCALE_COOKIE, body.locale, { path: '/', maxAge: 31536000, sameSite: 'lax', secure: request.nextUrl.protocol === 'https:' })
  if (body.timezone) response.cookies.set('club-timezone', body.timezone, { path: '/', maxAge: 31536000, sameSite: 'lax', secure: request.nextUrl.protocol === 'https:' })
  return response
}
