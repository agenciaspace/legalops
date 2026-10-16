'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DEFAULT_NEWS_PREFERENCES, NEWS_AUDIENCES, NEWS_TOPICS, type NewsAudience, type NewsTopic, type NewsPreferences } from '@/lib/news'

export function NewsPreferencesForm() {
  const [preferences, setPreferences] = useState<NewsPreferences>(DEFAULT_NEWS_PREFERENCES)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/club/news/preferences', { signal: controller.signal }).then(async response => {
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setPreferences(result.preferences)
    }).catch(cause => { if (!controller.signal.aborted) { setLoadFailed(true); setError(cause.message || 'Não conseguimos carregar suas preferências.') } }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])
  return <form aria-label="Preferências de notícias" className="my-5 rounded-lg border border-[#CEC8BD] bg-white p-5" onSubmit={async event => {
    event.preventDefault(); setBusy(true); setMessage(''); setError('')
    try {
      const response = await fetch('/api/club/news/preferences', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(preferences) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setPreferences(result.preferences); setMessage(preferences.enabled ? 'Preferências salvas. As notícias aparecerão no seu feed do Club.' : 'Preferências salvas. O recebimento no feed está desativado.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Tente novamente.') }
    finally { setBusy(false) }
  }}>
    <h2 className="text-lg font-semibold">Notícias do seu mercado</h2>
    <p className="mt-1 text-sm leading-6 text-[#69635E]">Escolha o que acompanhar do legalops.news dentro da comunidade.</p>
    <fieldset disabled={loading || loadFailed || busy} className="mt-4 space-y-4 disabled:opacity-60">
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={preferences.enabled} onChange={event => setPreferences(previous => ({ ...previous, enabled: event.target.checked }))} className="h-5 w-5 accent-[#C9684F]"/>Receber notícias no meu feed do Club</label>
      <fieldset><legend className="mb-1 text-xs font-semibold">Públicos que quero acompanhar</legend><div className="flex flex-wrap gap-x-5">{Object.entries(NEWS_AUDIENCES).map(([key, value]) => <label key={key} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={preferences.audiences.includes(key as NewsAudience)} onChange={event => setPreferences(previous => ({ ...previous, audiences: event.target.checked ? [...previous.audiences, key as NewsAudience] : previous.audiences.filter(item => item !== key) }))} className="h-4 w-4 accent-[#C9684F]"/>{value.label}</label>)}</div></fieldset>
      <fieldset><legend className="mb-1 text-xs font-semibold">Assuntos</legend><div className="flex flex-wrap gap-x-5">{Object.entries(NEWS_TOPICS).map(([key, value]) => <label key={key} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={preferences.topics.includes(key as NewsTopic)} onChange={event => setPreferences(previous => ({ ...previous, topics: event.target.checked ? [...previous.topics, key as NewsTopic] : previous.topics.filter(item => item !== key) }))} className="h-4 w-4 accent-[#C9684F]"/>{value}</label>)}</div></fieldset>
      <p className="text-xs leading-5 text-[#69635E]">Sem seleção, você acompanha todos os públicos e assuntos. Você pode alterar ou desativar quando quiser.</p>
      <button className="min-h-11 rounded-lg bg-[#24231F] px-5 text-sm font-semibold text-white">{busy ? 'Salvando…' : loading ? 'Carregando…' : 'Salvar preferências'}</button>
    </fieldset>
    {message && <p role="status" className="mt-3 text-sm text-green-800">{message}</p>}{error && <p role="alert" className="mt-3 text-sm text-red-800">{error}</p>}
    <p className="mt-4 border-t border-[#E6DED0] pt-4 text-sm leading-6 text-[#69635E]">Prefere receber por email? <a href="https://legalops.news/#newsletter" className="font-semibold text-[#A94E38] underline underline-offset-4">Assine a newsletter no legalops.news ↗</a>. A assinatura por email é independente desta preferência.</p>
    <Link href="/community/news" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">Ver notícias no Club →</Link>
  </form>
}
