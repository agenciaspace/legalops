'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TranslationSource } from '@/lib/club-translations'
import type { TranslationPayload } from '@/lib/club-translation-model'
import type { ClubLocale } from '@/lib/club-locale'
import { useClubLanguage } from './ClubLanguage'

let lastRefreshAt = 0

export function TranslatedContent({ source, original, enabled, serverLocale, compact = false, titleAs = 'h2', titleClassName, bodyClassName }: { source?: TranslationSource; original: TranslationPayload; enabled: boolean; serverLocale: ClubLocale; compact?: boolean; titleAs?: 'h1' | 'h2' | 'h3'; titleClassName?: string; bodyClassName?: string }) {
  const { locale, t } = useClubLanguage()
  const router = useRouter()
  const [originalSelection, setOriginalSelection] = useState<string | null>(null)
  const selection = `${locale}:${source?.revision}`
  const showOriginal = originalSelection === selection
  const [reported, setReported] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failedAction, setFailedAction] = useState(false)
  useEffect(() => { setOriginalSelection(null); setReported(false); setFailedAction(false) }, [locale, source?.revision])
  const current = locale === serverLocale
  const sameLanguage = source?.detected_locale === locale || source?.locale_hint === locale
  const translated = current && source?.status === 'ready' ? source.translations[locale] : undefined
  const available = !enabled || showOriginal || sameLanguage || translated
  const visible = !enabled || showOriginal || sameLanguage ? original : translated
  useEffect(() => {
    if (!enabled || !current || source?.status === 'ready' || source?.status === 'failed') return
    const timer = setInterval(() => { if (Date.now() - lastRefreshAt > 14000) { lastRefreshAt = Date.now(); router.refresh() } }, 15000)
    return () => clearInterval(timer)
  }, [enabled, current, source?.status, router])
  async function action(kind: 'report' | 'retry') {
    if (!source) return
    setBusy(true); setFailedAction(false)
    try {
      const response = await fetch('/api/club/translations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sourceId: source.id, revision: source.revision, locale, action: kind }) })
      if (!response.ok) throw new Error('failed')
      if (kind === 'report') setReported(true)
      router.refresh()
    } catch { setFailedAction(true) } finally { setBusy(false) }
  }
  const Title = titleAs
  return <div className={compact ? 'text-sm leading-6' : 'text-[13px] leading-[1.65]'}>
    {available && visible ? Object.entries(original).map(([field]) => {
      const value = visible[field]
      if (!value) return null
      if (Array.isArray(value)) return <ul key={field} className="list-disc pl-5">{value.map((item, i) => <li key={i}>{item}</li>)}</ul>
      return field === 'title' ? <Title key={field} className={titleClassName ?? "text-[17px] font-extrabold leading-6 text-[#252420]"}>{value}</Title> : <p key={field} className={bodyClassName ?? "mt-2 whitespace-pre-wrap break-words text-[#68655F]"}>{value}</p>
    }) : <p role="status" className="text-[#69635E]">{source?.status === 'failed' ? t('Tradução indisponível. Tente novamente.') : t('Traduzindo para seu idioma…')}</p>}
    {enabled && !sameLanguage && <div className="mt-2 flex flex-wrap items-center gap-x-3 text-xs text-[#817A73]">
      {translated && !showOriginal && <span>{t('Tradução automática')}</span>}
      <button type="button" className="min-h-11 underline" onClick={() => setOriginalSelection(showOriginal ? null : selection)}>{t(showOriginal ? 'Ver tradução' : 'Ver original')}</button>
      {source?.status === 'failed' && <button disabled={busy} className="min-h-11 underline" onClick={() => action('retry')}>{t('Tentar novamente')}</button>}
      {translated && <button disabled={busy || reported} className="min-h-11 underline" onClick={() => action('report')}>{t(reported ? 'Problema informado.' : 'Reportar problema na tradução')}</button>}
      {failedAction && <span role="alert">{t('Não conseguimos salvar. Tente novamente.')}</span>}
    </div>}
  </div>
}
