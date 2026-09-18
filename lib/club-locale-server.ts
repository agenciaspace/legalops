import { cookies } from 'next/headers'
import { CLUB_LOCALE_COOKIE, clubTranslator, normalizeClubLocale } from './club-locale'
export function getClubLocale() { return normalizeClubLocale(cookies().get(CLUB_LOCALE_COOKIE)?.value) }
export function getClubTranslator() { return clubTranslator(getClubLocale()) }
