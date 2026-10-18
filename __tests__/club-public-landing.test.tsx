import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ProOffer } from '@/lib/club-pro'

const state = vi.hoisted(() => ({ offer: null as ProOffer | null, error: null as unknown, from: vi.fn() }))
vi.mock('@/lib/supabase-server', () => ({ createServerSupabaseClient: async () => ({ from: state.from.mockImplementation(() => {
  const query: any = { select: () => query, eq: () => query, abortSignal: () => query, maybeSingle: async () => ({ data: state.offer, error: state.error }) }
  return query
}) }) }))
vi.mock('@/components/community/ResumeClubSession', () => ({ ResumeClubSession: () => null }))
import ClubLandingPage from '@/app/club/page'

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'public-test-key')
  state.offer = { active: true, price_cents: 4900, period_months: 1, payment_mode: 'mercadopago_subscription', payment_url: 'https://mpago.la/2gCAVGU', trial_days: 7 }
})
afterEach(() => { cleanup(); state.offer = null; state.error = null; vi.unstubAllEnvs(); vi.clearAllMocks() })

it('uses the current offer and directs purchase to the existing checkout', async () => {
  render(await ClubLandingPage())
  expect(state.from).toHaveBeenCalledWith('club_pro_offer')
  expect(screen.getAllByText(/R\$\s*49,00/).length).toBeGreaterThan(0)
  for (const link of screen.getAllByRole('link', { name: /Testar o Pro/ })) expect(link).toHaveAttribute('href', '/club/checkout')
  expect(screen.getByText(/teste de 7 dias começa no Mercado Pago/)).toHaveTextContent('em até um dia útil')
  expect(screen.getByText(/Após os 7 dias de teste/)).toHaveTextContent('até você cancelar')
  expect(screen.getByRole('link', { name: 'Entrar na comunidade gratuita' })).toHaveAttribute('href', '/cadastro')
  expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login?next=/community')
})

it('reflects an updated price instead of hardcoding pilot pricing', async () => {
  state.offer!.price_cents = 5900
  render(await ClubLandingPage())
  expect(screen.getAllByText(/R\$\s*59,00/).length).toBeGreaterThan(0)
  expect(screen.queryByText(/R\$\s*49,00/)).not.toBeInTheDocument()
})

it.each(['missing', 'inactive', 'invalid', 'error', 'unconfigured'])('does not sell a %s offer', async (condition) => {
  if (condition === 'missing') state.offer = null
  if (condition === 'inactive') state.offer!.active = false
  if (condition === 'invalid') state.offer!.payment_url = 'https://example.com/payment'
  if (condition === 'error') state.error = { message: 'Unavailable' }
  if (condition === 'unconfigured') vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
  render(await ClubLandingPage())
  expect(screen.getByText('Estamos preparando as novas assinaturas.')).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /Testar o Pro|Assinar/ })).not.toBeInTheDocument()
  expect(screen.queryByText(/R\$/)).not.toBeInTheDocument()
  expect(screen.queryByText(/teste grátis/)).not.toBeInTheDocument()
  expect(screen.getAllByRole('link', { name: /Falar sobre o Pro/ })[0]).toHaveAttribute('href', 'mailto:hi@legalops.club?subject=Club%20Pro')
})

it('preserves annual PIX pricing without advertising a recurring trial', async () => {
  state.offer = { active: true, price_cents: 19900, period_months: 12, payment_mode: 'pix' }
  render(await ClubLandingPage())
  expect(screen.getAllByText(/R\$\s*199,00/).length).toBeGreaterThan(0)
  expect(screen.getAllByText('/12 meses').length).toBeGreaterThan(0)
  expect(screen.getAllByRole('link', { name: /Assinar/ })[0]).toHaveAttribute('href', '/club/checkout')
  expect(screen.getByText(/A renovação é manual/)).toBeInTheDocument()
  expect(screen.queryByText(/teste grátis/)).not.toBeInTheDocument()
})
