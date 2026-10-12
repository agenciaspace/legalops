'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import { useClubLanguage } from './ClubLanguage'
import { normalizeBenchPhone } from '@/lib/bench-phone'

function Submit({ label }: { label?: string }) {
  const { pending } = useFormStatus()
  const { t } = useClubLanguage()
  return <button type="submit" disabled={pending} className="event-registration-primary" aria-live="polite">{pending ? t('Enviando…') : label || t('Quero participar')}</button>
}

export function EventRegistrationForm({ action, intro, contact, professional, footer, submitLabel }: {
  submitLabel?: string
  action: (data: FormData) => void | Promise<void>
  intro: ReactNode
  contact: ReactNode
  professional: ReactNode
  footer: ReactNode
}) {
  const { t } = useClubLanguage()
  const [step, setStep] = useState(0)
  const form = useRef<HTMLFormElement>(null)
  const changedStep = useRef(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const move = (next: number) => { changedStep.current = true; setStep(next) }
  useEffect(() => {
    if (!changedStep.current) return
    heading.current?.focus({ preventScroll: true })
    form.current?.closest('.event-workspace-panel')?.scrollTo?.({ top: 0 })
  }, [step])
  const validate = (index: number) => {
    const fields = form.current?.querySelectorAll<HTMLInputElement>(`[data-registration-step="${index}"] input`)
    return Array.from(fields ?? []).every(field => {
      if (field.name === 'phone') field.setCustomValidity(normalizeBenchPhone(field.value) ? '' : t('Informe seu WhatsApp com +DDI e DDD, usando o mesmo número do grupo do Bench.'))
      return field.reportValidity()
    })
  }
  return <form ref={form} action={action} noValidate onInput={event => { if (event.target instanceof HTMLInputElement) event.target.setCustomValidity('') }} className="event-registration" onSubmit={event => {
    if (step === 0) { event.preventDefault(); if (validate(0)) move(1); return }
    // Recheck both stages: autofill or edits must not bypass required fields.
    const invalidContact = form.current?.querySelector<HTMLInputElement>('[data-registration-step="0"] input:invalid')
    if (invalidContact) { event.preventDefault(); move(0); return }
    if (!validate(1)) event.preventDefault()
  }}>
    {intro}
    <ol className="event-registration-progress" aria-label={t('Etapas da inscrição')}>
      {[t('Contato'), t('Perfil profissional')].map((label, index) => <li key={index} aria-current={step === index ? 'step' : undefined}><span aria-hidden="true">{index + 1}</span>{label}</li>)}
    </ol>
    <h3 ref={heading} tabIndex={-1} className="text-base font-semibold outline-none">{t(step === 0 ? 'Como podemos falar com você?' : 'Seu contexto profissional')}</h3>
    <p className="mt-1 text-xs leading-5 text-[#625E59]">{t(step === 0 ? 'Usaremos estes contatos para enviar os detalhes do encontro.' : 'Essas informações ajudam a organizar a conversa.')}</p>
    <div data-registration-step="0" hidden={step !== 0}>{contact}</div>
    <div data-registration-step="1" hidden={step !== 1}>{professional}</div>
    <div className="event-registration-actions">
      {step === 1 && <button type="button" className="event-registration-back" onClick={() => move(0)}>{t('Voltar')}</button>}
      {step === 0 ? <button type="submit" className="event-registration-primary">{t('Continuar')}</button> : <Submit label={submitLabel} />}
    </div>
    {footer}
  </form>
}
