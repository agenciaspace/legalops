'use client'

import { createContext, useContext, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Locale } from '@/lib/locale'
import { LOCALE_COOKIE } from '@/lib/locale'
import type { Dictionary } from '@/lib/dictionaries'

interface LocaleContextValue {
  locale: Locale
  t: Dictionary
  setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within a LocaleProvider')
  return ctx
}

interface LocaleProviderProps {
  locale: Locale
  dictionary: Dictionary
  children: React.ReactNode
}

export function LocaleProvider({ locale, dictionary, children }: LocaleProviderProps) {
  const router = useRouter()

  const setLocale = useCallback(
    (newLocale: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${newLocale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`
      router.refresh()
    },
    [router]
  )

  return (
    <LocaleContext.Provider value={{ locale, t: dictionary, setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}
