import { afterEach, beforeEach, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { EventWorkspace, EventSectionButton } from '@/components/community/EventWorkspace'

beforeEach(() => window.history.replaceState({}, '', '/community/events/bench-netlex-2026'))
afterEach(cleanup)
const sections = [
  { id: 'sobre', label: 'Sobre', content: <><p>Descrição do encontro</p><EventSectionButton section="inscricao">Reserve sua vaga</EventSectionButton></> },
  { id: 'inscricao', label: 'Participar', content: <input aria-label="Nome" /> },
  { id: 'resumos', label: 'Resumos', content: <p>Arquivo autorizado</p> },
]

it('shows one panel at a time and keeps the registration CTA in the same page', () => {
  render(<EventWorkspace header={<h1>Encontro</h1>} sections={sections} />)
  expect(screen.getAllByRole('tabpanel')).toHaveLength(1)
  fireEvent.click(screen.getByRole('button', { name: 'Reserve sua vaga' }))
  expect(screen.getByRole('textbox', { name: 'Nome' })).toBeVisible()
  expect(screen.getByText('Descrição do encontro')).not.toBeVisible()
  expect(screen.getByRole('tab', { name: 'Participar' })).toHaveFocus()
  expect(window.location.search).toBe('?tab=inscricao')
})

it('supports roving keyboard focus across all tabs', () => {
  render(<EventWorkspace header={<h1>Encontro</h1>} sections={sections} />)
  const about = screen.getByRole('tab', { name: 'Sobre' })
  fireEvent.keyDown(about, { key: 'End' })
  const summaries = screen.getByRole('tab', { name: 'Resumos' })
  expect(summaries).toHaveFocus()
  expect(summaries).toHaveAttribute('aria-selected', 'true')
  fireEvent.keyDown(summaries, { key: 'ArrowRight' })
  expect(about).toHaveFocus()
  expect(screen.getAllByRole('tabpanel')).toHaveLength(1)
})

it('honors existing summary deep links and restores URL navigation', () => {
  window.history.replaceState({}, '', '/community/events/bench-netlex-2026#resumos')
  render(<EventWorkspace header={<h1>Encontro</h1>} sections={sections} />)
  expect(screen.getByText('Arquivo autorizado')).toBeVisible()
  window.history.replaceState({}, '', '/community/events/bench-netlex-2026?tab=inscricao')
  fireEvent.popState(window)
  expect(screen.getByRole('textbox', { name: 'Nome' })).toBeVisible()
})
