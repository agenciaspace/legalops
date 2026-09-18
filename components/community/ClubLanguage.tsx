'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Languages } from 'lucide-react'
import { CLUB_LOCALE_COOKIE, clubTranslator, normalizeClubLocale, type ClubLocale } from '@/lib/club-locale'

const Context = createContext({ locale: 'pt-BR' as ClubLocale, setLocale: (_locale: ClubLocale) => {} })
export function ClubLanguageProvider({ initialLocale, children }: { initialLocale: ClubLocale; children: React.ReactNode }) {
  const [locale, setLocale] = useState(initialLocale)
  useEffect(() => { document.documentElement.lang = locale }, [locale])
  return <Context.Provider value={{ locale, setLocale }}>{children}</Context.Provider>
}
export function useClubLanguage() { const context = useContext(Context); return { ...context, t: clubTranslator(context.locale) } }
export function ClubLanguageSelect() {
  const { locale, setLocale } = useClubLanguage()
  const router = useRouter()
  return <label className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-[#CEC8BD] bg-white px-2 text-xs font-semibold">
    <Languages aria-hidden="true" className="h-4 w-4" /><span className="sr-only">Idioma / Language</span>
    <select aria-label="Idioma / Language" value={locale} onChange={event => {
      const value = normalizeClubLocale(event.target.value)
      document.cookie = `${CLUB_LOCALE_COOKIE}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
      setLocale(value); router.refresh()
    }} className="min-h-11 max-w-24 bg-transparent text-xs outline-offset-2"><option value="pt-BR">Português</option><option value="en">English</option></select>
  </label>
}
