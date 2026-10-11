import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ProNotice } from '@/components/community/ProNotice'
beforeEach(() => localStorage.clear())
afterEach(() => { cleanup(); vi.restoreAllMocks() })
it('shows benefits and dismisses persistently without navigating or blocking the app', () => {
  const view = render(<><ProNotice userId="free" /><button>Usar comunidade</button></>)
  expect(screen.getByRole('link', { name: 'Conhecer Pro' })).toHaveAttribute('href', '/community/pro')
  fireEvent.click(screen.getByRole('button', { name: 'Fechar aviso do Pro' }))
  expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Usar comunidade' })).toBeEnabled()
  view.unmount(); render(<ProNotice userId="free" />)
  expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
})
it('keeps the dismissal separate for each account', () => {
  const view = render(<ProNotice userId="first" />)
  fireEvent.click(screen.getByRole('button', { name: 'Fechar aviso do Pro' }))
  view.rerender(<ProNotice userId="second" />)
  expect(screen.getByRole('complementary', { name: 'Benefícios do Club Pro' })).toBeInTheDocument()
})
it('still permits closing when browser storage is unavailable', () => {
  vi.spyOn(Storage.prototype,'getItem').mockImplementation(() => { throw new Error('Unavailable') })
  vi.spyOn(Storage.prototype,'setItem').mockImplementation(() => { throw new Error('Unavailable') })
  render(<ProNotice userId="free" />)
  fireEvent.click(screen.getByRole('button', { name: 'Fechar aviso do Pro' }))
  expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
})
