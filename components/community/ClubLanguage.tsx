'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Languages } from 'lucide-react'
import { CLUB_LOCALE_COOKIE, clubTranslator, normalizeClubLocale, type ClubLocale } from '@/lib/club-locale'

const Context = createContext({ locale: 'pt-BR' as ClubLocale, setLocale: (_locale: ClubLocale) => {} })
export function ClubLanguageProvider({ initialLocale, children }: { initialLocale: ClubLocale; children: React.ReactNode }) {
  const [locale, setLocale] = useState(initialLocale)
  useEffect(() => { setLocale(initialLocale) }, [initialLocale])
  useEffect(() => { document.documentElement.lang = locale }, [locale])
  useEffect(() => {
    // An explicit stored preference is never overwritten by browser initialization.
    fetch('/api/account/preferences', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locale: initialLocale, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, initialize: true }) }).catch(() => {})
  }, [initialLocale])
  return <Context.Provider value={{ locale, setLocale }}>{children}</Context.Provider>
}
export function useClubLanguage() { const context = useContext(Context); return { ...context, t: clubTranslator(context.locale) } }
export function ClubLanguageSelect({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useClubLanguage()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  return <div><label className={`relative inline-flex min-h-11 items-center justify-center gap-1 rounded-lg border border-[#CEC8BD] bg-white px-2 text-xs font-semibold focus-within:ring-2 focus-within:ring-[#E88A6A] ${compact ? "w-16" : ""}`}>
    <Languages aria-hidden="true" className="h-4 w-4" /><span className="sr-only">Idioma / Language / Idioma</span>
    {compact && <span aria-hidden="true">{locale.split("-")[0].toUpperCase()}</span>}
    <select aria-label="Idioma / Language / Idioma" disabled={busy} value={locale} onChange={async event => {
      const value = normalizeClubLocale(event.target.value)
      setBusy(true); setFailed(false)
      try {
        const response = await fetch('/api/account/preferences', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locale: value }) })
        if (!response.ok && response.status !== 401) throw new Error('preferences_unavailable')
        document.cookie = `${CLUB_LOCALE_COOKIE}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
        setLocale(value); router.refresh()
      } catch { setFailed(true) } finally { setBusy(false) }
    }} className={compact ? "absolute inset-0 min-h-11 w-full cursor-pointer opacity-0" : "min-h-11 max-w-24 bg-transparent text-xs outline-offset-2"}><option value="pt-BR">Português</option><option value="en">English</option><option value="es">Español</option></select>
  </label>{failed && <p role="alert" className="mt-1 text-xs">{t('Não conseguimos salvar o idioma. Tente novamente.')}</p>}</div>
}
