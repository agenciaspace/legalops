import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
const state = vi.hoisted(() => ({ events: [] as any[], published: vi.fn() }))
vi.mock('@/lib/supabase-server', () => ({ createServerSupabaseClient: async () => ({ from: () => {
  const query: any = { select: () => query, eq: state.published.mockImplementation(() => query), order: () => query, limit: () => query, abortSignal: async () => ({ data: state.events }) }
  return query
} }) }))
vi.mock('@/components/community/ResumeClubSession', () => ({ ResumeClubSession: () => null }))
import ClubLandingPage from '@/app/club/page'
afterEach(() => { cleanup(); state.events = []; vi.unstubAllEnvs(); vi.clearAllMocks() })
it('links the free signup and separate Pro offer without inventing events', async () => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
  render(await ClubLandingPage())
  expect(screen.getAllByRole('link', { name: 'Criar meu perfil gratuito' })[0]).toHaveAttribute('href', '/cadastro')
  expect(screen.getByRole('link', { name: /Conhecer o Pro/ })).toHaveAttribute('href', '/club/checkout')
  expect(screen.getByRole('link', { name: 'Conhecer os fóruns →' })).toHaveAttribute('href', '/community')
})
it('uses published upcoming meetings and hides placeholder dates', async () => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'public-test-key')
  state.events = [{ id: 'pending', slug: 'bench-netlex', title: 'Experiências com o NetLex', description: 'Troca entre profissionais.', starts_at: '2099-11-01T00:00:00Z', ends_at: null, location_label: 'Data a confirmar' }, { id:'past', slug:'bench-past', title:'Encontro antigo', starts_at:'2020-01-01T00:00:00Z', ends_at:null, location_label:'São Paulo' }]
  render(await ClubLandingPage())
  expect(state.published).toHaveBeenCalledWith('is_published', true)
  expect(screen.getByRole('link', { name: 'Conhecer o encontro →' })).toHaveAttribute('href', '/community/events/bench-netlex')
  expect(screen.getAllByText('Data e formato a confirmar').length).toBeGreaterThan(0)
  expect(screen.queryByText(/2099/)).not.toBeInTheDocument()
  expect(screen.queryByText('Encontro antigo')).not.toBeInTheDocument()
})
