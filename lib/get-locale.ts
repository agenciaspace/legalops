import { cookies } from 'next/headers'
import type { Locale } from './locale'
import { DEFAULT_LOCALE, LOCALE_COOKIE } from './locale'

export async function getLocale(): Promise<Locale> {
  const store = await cookies()
  const val = store.get(LOCALE_COOKIE)?.value
  return val === 'en' ? 'en' : DEFAULT_LOCALE
}
