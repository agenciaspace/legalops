'use client'

import { useId, useRef, useState, type ReactNode } from 'react'
import { useClubLanguage } from './ClubLanguage'

const sections = [['public', 'Perfil público'], ['career', 'Carreira'], ['preferences', 'Preferências']] as const
type Section = typeof sections[number][0]

export function ProfileSections({ publicFields, careerFields, preferences }: { publicFields: ReactNode; careerFields: ReactNode; preferences: ReactNode }) {
  const { t } = useClubLanguage()
  const id = useId()
  const [active, setActive] = useState<Section>('public')
  const focusing = useRef(false)
  return <div className="profile-sections" onInvalidCapture={event => {
    const field = event.target as HTMLInputElement
    const panel = field.closest<HTMLElement>('[data-profile-panel]')
    if (!panel) return
    if (!panel.hidden) {
      if (!focusing.current) {
        focusing.current = true
        requestAnimationFrame(() => { focusing.current = false })
      }
      return
    }
    event.preventDefault()
    if (focusing.current) return
    focusing.current = true
    setActive(panel.dataset.profilePanel as Section)
    requestAnimationFrame(() => { field.focus(); field.reportValidity(); focusing.current = false })
  }}>
    <div className="brand-tabs" role="tablist" aria-label={t('Meu perfil')}>
      {sections.map(([key, label], index) => <button type="button" role="tab" key={key} id={`${id}-tab-${key}`} aria-controls={`${id}-panel-${key}`} aria-selected={active === key} tabIndex={active === key ? 0 : -1} onClick={() => setActive(key)} onKeyDown={event => {
        let next = index
        if (event.key === 'ArrowRight') next = (index + 1) % sections.length
        else if (event.key === 'ArrowLeft') next = (index + sections.length - 1) % sections.length
        else if (event.key === 'Home') next = 0
        else if (event.key === 'End') next = sections.length - 1
        else return
        event.preventDefault(); setActive(sections[next][0]); document.getElementById(`${id}-tab-${sections[next][0]}`)?.focus()
      }}>{t(label)}</button>)}
    </div>
    {sections.map(([key]) => <section key={key} role="tabpanel" id={`${id}-panel-${key}`} aria-labelledby={`${id}-tab-${key}`} data-profile-panel={key} hidden={active !== key}>{key === 'public' ? publicFields : key === 'career' ? careerFields : preferences}</section>)}
  </div>
}
