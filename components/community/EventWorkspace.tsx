'use client'

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { LockKeyhole } from 'lucide-react'

type Section = { id: string; label: string; content: ReactNode; locked?: boolean }
const EventNavigation = createContext<(section: string) => void>(() => {})

export function EventSectionButton({ section, children, className }: { section: string; children: ReactNode; className?: string }) {
  const select = useContext(EventNavigation)
  return <button type="button" onClick={() => select(section)} className={className}>{children}</button>
}

export function EventWorkspace({ header, sections, initialSection = 'sobre' }: { header: ReactNode; sections: Section[]; initialSection?: string }) {
  const id = useId()
  const root = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(initialSection)
  const selected = sections.some(section => section.id === active) ? active : sections[0].id
  const select = useCallback((section: string) => {
    setActive(section)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', section)
    if (section !== 'discussoes') url.searchParams.delete('topic')
    url.hash = ''
    window.history.replaceState(window.history.state, '', url)
    document.getElementById(`${id}-tab-${section}`)?.focus({ preventScroll: true })
  }, [id])

  useEffect(() => {
    const restore = () => {
      const url = new URL(window.location.href)
      setActive(url.hash === '#resumos' ? 'resumos' : url.searchParams.get('tab') || initialSection)
    }
    restore()
    window.addEventListener('popstate', restore)
    window.addEventListener('hashchange', restore)
    return () => { window.removeEventListener('popstate', restore); window.removeEventListener('hashchange', restore) }
  }, [initialSection])

  useEffect(() => {
    const element = root.current
    if (!element) return
    // Account for the actual header, membership notices, mobile nav and keyboard.
    const resize = () => {
      const viewport = window.visualViewport
      const bottomNav = document.querySelector('.club-bottom-nav')?.getBoundingClientRect().height || 0
      // Use document coordinates: a browser scroll must never grow the workspace.
      const top = Math.max(0, element.getBoundingClientRect().top + window.scrollY)
      const viewportHeight = viewport && viewport.scale === 1 ? viewport.height : window.innerHeight
      document.documentElement.style.setProperty('--event-viewport-height', `${viewportHeight}px`)
      const height = viewportHeight - top - bottomNav
      element.dataset.compact = String(height < 360)
      element.style.setProperty('--event-height', `${Math.max(0, height)}px`)
    }
    resize()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize)
    observer?.observe(document.body)
    // Notices can change without changing the outer document height.
    document.querySelectorAll('.club-content > aside, main > aside').forEach(notice => observer?.observe(notice))
    window.addEventListener('resize', resize)
    window.visualViewport?.addEventListener('resize', resize)
    return () => { document.documentElement.style.removeProperty('--event-viewport-height'); observer?.disconnect(); window.removeEventListener('resize', resize); window.visualViewport?.removeEventListener('resize', resize) }
  }, [])

  return <EventNavigation.Provider value={select}>
    <div ref={root} className="event-workspace" data-event-workspace>
      <header className="event-workspace-header">{header}</header>
      <div role="tablist" aria-label="Conteúdo do evento" className={`event-workspace-tabs ${sections.length > 4 ? 'event-workspace-tabs-many' : ''}`} style={{ '--event-tabs': sections.length } as React.CSSProperties}>
        {sections.map((section, index) => <button type="button" key={section.id} id={`${id}-tab-${section.id}`} role="tab" aria-selected={selected === section.id} aria-controls={`${id}-panel-${section.id}`} tabIndex={selected === section.id ? 0 : -1} onClick={() => select(section.id)} onKeyDown={event => {
          if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return
          event.preventDefault()
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? sections.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + sections.length) % sections.length
          select(sections[next].id)
          document.getElementById(`${id}-tab-${sections[next].id}`)?.focus()
        }}>{section.locked && <LockKeyhole className="h-3 w-3 shrink-0" aria-hidden="true" />}<span>{section.label}</span></button>)}
      </div>
      {sections.map(section => <section key={section.id} role="tabpanel" id={`${id}-panel-${section.id}`} aria-labelledby={`${id}-tab-${section.id}`} hidden={selected !== section.id} tabIndex={0} className="event-workspace-panel">
        {section.content}
      </section>)}
    </div>
  </EventNavigation.Provider>
}
