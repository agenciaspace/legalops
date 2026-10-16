'use client'

import { useId, useState } from 'react'
import { NEWS_AUDIENCES, type NewsAudience } from '@/lib/news'

export function NewsSignup({ connected = false }: { connected?: boolean }) {
  const id = useId()
  const [audiences, setAudiences] = useState<NewsAudience[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  return <form className="news-signup" onSubmit={async event => {
    event.preventDefault()
    const form = event.currentTarget
    const fields = new FormData(form)
    setBusy(true); setError(''); setMessage('')
    try {
      const response = await fetch('/api/news/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: fields.get('email'), consent: fields.get('consent') === 'on', company: fields.get('company'), audiences, topics: [] }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Não conseguimos registrar sua inscrição.')
      setMessage(result.message); form.reset(); setAudiences([])
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Tente novamente.') }
    finally { setBusy(false) }
  }}>
    <label htmlFor={`${id}-email`}>Seu email</label>
    <div className="news-email-row"><input id={`${id}-email`} name="email" type="email" autoComplete="email" maxLength={254} required placeholder="voce@empresa.com.br"/><button disabled={busy}>{busy ? 'Registrando…' : connected ? 'Assinar newsletter ↗' : 'Quero receber ↗'}</button></div>
    <fieldset><legend>O que interessa a você? <span>(opcional)</span></legend><div className="news-choice-row">{Object.entries(NEWS_AUDIENCES).map(([key, audience]) => <label key={key}><input type="checkbox" checked={audiences.includes(key as NewsAudience)} onChange={event => setAudiences(previous => event.target.checked ? [...previous, key as NewsAudience] : previous.filter(item => item !== key))}/>{audience.label}</label>)}</div></fieldset>
    <div className="news-honeypot" aria-hidden="true"><label>Empresa<input name="company" tabIndex={-1} autoComplete="off"/></label></div>
    <label className="news-consent"><input name="consent" type="checkbox" required/><span>Quero receber a newsletter do legalops.news por email. Posso cancelar a qualquer momento.</span></label>
    {!connected && <p className="news-form-note">A edição por email está em preparação. Registre seu interesse e receba o convite para confirmar a assinatura quando ela abrir.</p>}
    <p className="news-form-note">{connected ? 'Entrega por beehiiv, com confirmação por email. ' : ''}<a href="https://legalops.news/privacidade">Como usamos seus dados</a>.</p>
    {message && <p role="status" className="news-form-success">{message}</p>}{error && <p role="alert" className="news-form-error">{error}</p>}
  </form>
}
