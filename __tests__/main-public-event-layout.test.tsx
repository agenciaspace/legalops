import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({ authReads: 0 }))

vi.mock('next/headers', () => ({
  headers: () => new Headers({ 'x-public-event-fallback': 'bench-honorarios-exito-2026' }),
}))
vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser: async () => { state.authReads++; return { data: { user: null } } } },
  }),
}))
vi.mock('@/components/Nav', () => ({ Nav: () => <nav>Private navigation</nav> }))
vi.mock('@/components/AppMain', () => ({ AppMain: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }))

import MainLayout from '@/app/(main)/layout'

beforeEach(() => { state.authReads = 0 })
afterEach(cleanup)

it('renders a reviewed public event without reading the authenticated session', async () => {
  render(await MainLayout({ children: <p>Public Bench</p> }))
  expect(screen.getByText('Public Bench')).toBeInTheDocument()
  expect(state.authReads).toBe(0)
})
