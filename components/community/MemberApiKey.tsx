'use client'

import { useEffect, useRef, useState } from 'react'
import { useClubLanguage } from './ClubLanguage'
import { memberKeyCopy, memberKeyErrorMessage } from '@/lib/club-api-key-copy'

type Connection = { provider: 'openai'; model: string; last_four: string }

export function MemberApiKey() {
  const { locale } = useClubLanguage()
  const copy = memberKeyCopy(locale)
  const [connection, setConnection] = useState<Connection | null>(null)
  const [available, setAvailable] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<'save' | 'remove' | null>(null)
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState<'saved' | 'removed' | null>(null)
  const keyInput = useRef<HTMLInputElement>(null)
  const inFlight = useRef(false)

  async function load(signal?: AbortSignal) {
    setLoading(true); setError('')
    try {
      const response = await fetch('/api/club/api-key', { cache: 'no-store', signal: signal ?? AbortSignal.timeout(15000) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setConnection(data.connection); setAvailable(data.available)
    } catch (failure) {
      if (!signal?.aborted) setError(failure instanceof Error ? failure.message : 'key_storage_unavailable')
    } finally { if (!signal?.aborted) setLoading(false) }
  }
  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => { controller.abort(); setLoading(false); setError('key_storage_unavailable') }, 15000)
    void load(controller.signal).finally(() => clearTimeout(timeout))
    return () => { clearTimeout(timeout); controller.abort() }
  }, [])

  async function mutate(method: 'PUT' | 'DELETE') {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(method === 'PUT' ? 'save' : 'remove'); setError(''); setNotice(null)
    try {
      const response = await fetch('/api/club/api-key', {
        method, headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
        signal: AbortSignal.timeout(20000),
        ...(method === 'PUT' ? { body: JSON.stringify({ api_key: keyInput.current?.value.trim(), consent }) } : {}),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setConnection(data.connection); setAvailable(data.available); setConsent(false)
      setNotice(method === 'PUT' ? 'saved' : 'removed')
      window.dispatchEvent(new Event('club-api-key-changed'))
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'key_storage_unavailable') }
    finally {
      // Never retain the key in React state or browser storage, even after a failed save.
      if (keyInput.current) keyInput.current.value = ''
      inFlight.current = false; setBusy(null)
    }
  }

  return <section id="api-key" aria-labelledby="api-key-title" className="mt-6 scroll-mt-24 rounded-xl border border-[#CEC8BD] bg-white p-5 sm:p-6">
    <h2 id="api-key-title" className="text-lg font-semibold">{copy.title}</h2>
    <p className="mt-2 text-sm">{copy.intro}</p>
    <p className="mt-2 text-sm leading-6 text-[#625E59]">{copy.billing}</p>
    <p className="mt-2 text-sm leading-6 text-[#625E59]">{copy.privacy}</p>
    {loading ? <p role="status" className="mt-4 text-sm">{copy.loading}</p> : <>
      {connection && <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-[#F5F1E8] p-3">
        <p className="min-w-0 break-words text-sm font-semibold">OpenAI · {copy.connected} · ••••{connection.last_four}</p>
        <button type="button" disabled={!!busy} onClick={() => void mutate('DELETE')} className="min-h-11 rounded-lg border border-[#CEC8BD] px-3 text-sm underline disabled:opacity-50">{busy === 'remove' ? copy.removing : copy.disconnect}</button>
      </div>}
      {available ? <form className="mt-4 max-w-xl" onSubmit={event => { event.preventDefault(); void mutate('PUT') }}>
        <label htmlFor="openai-api-key" className="block text-sm font-semibold">{copy.label}</label>
        <input ref={keyInput} id="openai-api-key" type="password" autoComplete="off" autoCapitalize="none" spellCheck={false} required minLength={23} maxLength={503} disabled={!!busy} placeholder="sk-…" className="mt-2 min-h-12 w-full min-w-0 rounded-lg border border-[#CEC8BD] px-3 text-base" />
        <label className="mt-3 flex min-h-11 items-start gap-3 text-sm leading-6"><input type="checkbox" checked={consent} required disabled={!!busy} onChange={event => setConsent(event.target.checked)} className="mt-1 h-5 w-5 shrink-0"/><span>{copy.consent}</span></label>
        <button disabled={!!busy || !consent} className="mt-3 min-h-12 rounded-lg bg-[#24231F] px-4 text-sm font-semibold text-white disabled:opacity-50">{busy === 'save' ? copy.busy : connection ? copy.replace : copy.connect}</button>
        <p className="mt-3 text-xs leading-5 text-[#625E59]">{copy.model}</p>
      </form> : <button type="button" disabled={!!busy} onClick={() => void load()} className="mt-3 min-h-11 rounded-lg border px-3 text-sm">{copy.retry}</button>}
    </>}
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{memberKeyErrorMessage(error, locale)}</p>}
    {notice && <p role="status" className="mt-3 text-sm text-emerald-800">{copy[notice]}</p>}
    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
      <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline">{copy.create}</a>
      <a href="https://platform.openai.com/usage" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline">{copy.usage}</a>
    </div>
  </section>
}

export function MemberApiKeyIndicator() {
  const { locale } = useClubLanguage()
  const copy = memberKeyCopy(locale)
  const [connected, setConnected] = useState<boolean | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    const refresh = async () => {
      try {
        const response = await fetch('/api/club/api-key', { cache: 'no-store', signal: controller.signal })
        if (!response.ok) { setConnected(null); return }
        const data = await response.json()
        if (!controller.signal.aborted) setConnected(Boolean(data.connection))
      } catch { if (!controller.signal.aborted) setConnected(null) }
    }
    void refresh()
    window.addEventListener('club-api-key-changed', refresh)
    return () => { controller.abort(); window.removeEventListener('club-api-key-changed', refresh) }
  }, [])
  return <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 border-b border-[#E6DED0] text-xs text-[#625E59]">
    {connected !== null && <span>{connected ? copy.active : copy.club}</span>}
    <a href="/community/profile#api-key" className="inline-flex min-h-11 items-center underline">{copy.manage}</a>
  </div>
}
