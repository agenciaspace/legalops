'use client'

import { useId, useState, type ReactNode } from 'react'
import { useClubLanguage } from './ClubLanguage'

export function EventSections({ upcoming, past }: { upcoming: ReactNode; past: ReactNode }) {
  const { t } = useClubLanguage()
  const id = useId()
  const [active, setActive] = useState<'upcoming' | 'past'>('upcoming')
  return <div className="event-sections">
    <div className="brand-tabs" role="tablist" aria-label={t('Eventos')}>
      {(['upcoming', 'past'] as const).map(key => <button type="button" key={key} id={`${id}-tab-${key}`} role="tab" aria-selected={active === key} aria-controls={`${id}-panel-${key}`} tabIndex={active === key ? 0 : -1} onClick={() => setActive(key)} onKeyDown={event => {
        if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return
        event.preventDefault()
        const next = event.key === 'Home' ? 'upcoming' : event.key === 'End' ? 'past' : key === 'upcoming' ? 'past' : 'upcoming'
        setActive(next); document.getElementById(`${id}-tab-${next}`)?.focus()
      }}>{t(key === 'upcoming' ? 'Próximos encontros' : 'Encontros realizados')}</button>)}
    </div>
    <section id={`${id}-panel-upcoming`} role="tabpanel" aria-labelledby={`${id}-tab-upcoming`} hidden={active !== 'upcoming'}>{upcoming}</section>
    <section id={`${id}-panel-past`} role="tabpanel" aria-labelledby={`${id}-tab-past`} hidden={active !== 'past'}>{past}</section>
  </div>
}
