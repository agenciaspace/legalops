'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useClubLanguage } from './ClubLanguage'

export function ProNotice({ userId }: { userId: string }) {
  const { locale } = useClubLanguage()
  const copy = locale === 'en'
    ? { benefits: 'Pro: your personal agent, summaries and tailored résumés.', link: 'Explore Pro', close: 'Dismiss Pro notice', label: 'Club Pro benefits' }
    : locale === 'es'
      ? { benefits: 'Pro: agente personal, resúmenes y currículums personalizados.', link: 'Conocer Pro', close: 'Cerrar aviso de Pro', label: 'Beneficios de Club Pro' }
      : { benefits: 'Pro: agente pessoal, resumos e currículo personalizado.', link: 'Conhecer Pro', close: 'Fechar aviso do Pro', label: 'Benefícios do Club Pro' }
  const key = `club-pro-notice-dismissed:v1:${userId}`
  const [state, setState] = useState<{ key: string; visible: boolean } | null>(null)
  useEffect(() => {
    const refresh = () => {
      let visible = true
      try { visible = localStorage.getItem(key) !== '1' } catch { /* Storage may be unavailable. */ }
      setState({ key, visible })
    }
    refresh()
    const onStorage = (event: StorageEvent) => { if (event.key === key || event.key === null) refresh() }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key])
  if (state?.key !== key || !state.visible) return null
  return <aside aria-label={copy.label} className="border-b border-[#E6DED0] bg-[#FAF8F3] text-[#625E59]">
    <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 sm:px-6">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 py-2 text-xs leading-5">
        <p>{copy.benefits}</p>
        <Link href="/community/pro" className="inline-flex min-h-11 items-center font-semibold text-[#48443F] underline underline-offset-2">{copy.link}</Link>
      </div>
      <button type="button" aria-label={copy.close} onClick={() => {
        setState({ key, visible: false })
        try { localStorage.setItem(key, '1') } catch { /* Dismiss for this render even without storage. */ }
      }} className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg hover:bg-[#EEE9DF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"><X className="h-4 w-4" aria-hidden="true" /></button>
    </div>
  </aside>
}
