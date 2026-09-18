import { cookies, headers } from 'next/headers'
import { CLUB_LOCALE_COOKIE, browserClubLocale, clubTranslator, normalizeClubLocale, normalizeClubTimezone } from './club-locale'
export function getClubLocale() { return normalizeClubLocale(headers().get('x-club-locale') ?? cookies().get(CLUB_LOCALE_COOKIE)?.value ?? browserClubLocale(headers().get('accept-language'))) }
export function getClubTimezone() { return normalizeClubTimezone(headers().get('x-club-timezone')) }
export function getClubTranslator() { return clubTranslator(getClubLocale()) }
