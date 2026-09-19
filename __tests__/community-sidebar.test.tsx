import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
vi.mock('next/navigation', () => ({ usePathname: () => '/community/tools/mapa-contratos' }))
import { CommunityTabs } from '@/components/community/CommunityTabs'
afterEach(() => { cleanup(); localStorage.clear() })
it('collapses, keeps navigation accessible, restores preference and expands again', () => {
  const view = render(<CommunityTabs />)
  fireEvent.click(screen.getByRole('button', { name: 'Recolher menu lateral' }))
  expect(localStorage.getItem('club-sidebar-collapsed')).toBe('1')
  expect(screen.getByRole('button', { name: 'Expandir menu lateral' })).toHaveAttribute('aria-expanded', 'false')
  expect(screen.getAllByRole('link', { name: 'Recursos' })[0]).toHaveAttribute('href', '/community/tools')
  view.unmount(); render(<CommunityTabs />)
  fireEvent.click(screen.getByRole('button', { name: 'Expandir menu lateral' }))
  expect(localStorage.getItem('club-sidebar-collapsed')).toBe('0')
  expect(screen.getByRole('button', { name: 'Recolher menu lateral' })).toHaveAttribute('aria-expanded', 'true')
})
