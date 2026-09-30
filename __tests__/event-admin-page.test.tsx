import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  requireEventAdmin: vi.fn(),
  loadOverview: vi.fn(),
}))

vi.mock('@/lib/event-admin-access', () => ({ requireEventAdminAccess: state.requireEventAdmin }))
vi.mock('@/lib/event-admin', () => ({ loadEventAdminOverview: state.loadOverview }))

import EventRegistrationsAdminPage from '@/app/club/admin/events/[slug]/page'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

it('shows event registration details and Club linkage only after admin authorization', async () => {
  state.requireEventAdmin.mockResolvedValue({ user: { id: 'admin' } })
  state.loadOverview.mockResolvedValue({
    event: { id: 'event', slug: 'bench-netlex-2026', title: 'Bench: experiências com o NetLex' },
    registrations: [
      {
        id: 'rsvp-1', response: 'confirmed', guest_name: 'Ana Lima', guest_email: 'ana@example.com',
        guest_role: 'Head Jurídico', organization_name: 'Empresa A', guest_phone: '+55 11 90000-0000',
        dietary_restrictions: null, accessibility_needs: null, arrival_notes: 'Quer comparar integrações.',
        confirmed_at: '2026-09-30T12:00:00Z', created_at: '2026-09-30T12:00:00Z',
        club: { user_id: 'user-1', display_name: 'Ana Lima', current_role: 'Head Jurídico', organization_name: 'Empresa A', linkedin_url: 'https://www.linkedin.com/in/ana', club_access_status: 'active', profile_verification_status: 'verified', created_at: '2026-09-20T12:00:00Z' },
      },
      {
        id: 'rsvp-2', response: 'declined', guest_name: 'Bruno Souza', guest_email: 'bruno@example.com',
        guest_role: 'Legal Ops', organization_name: 'Empresa B', guest_phone: null,
        dietary_restrictions: null, accessibility_needs: null, arrival_notes: null,
        confirmed_at: null, created_at: '2026-09-29T12:00:00Z', club: null,
      },
    ],
    counts: { total: 2, confirmed: 1, declined: 1, pending: 0, clubLinked: 1 },
    whatsapp: {
      config: { enabled: true, summary_hour_local: 18, time_zone: 'America/Sao_Paulo', next_run_at: '2026-09-30T21:00:00Z', last_status: 'scheduled', last_period_end: null, last_checked_at: null },
      summaries: [],
    },
  })

  render(await EventRegistrationsAdminPage({ params: { slug: 'bench-netlex-2026' } }))

  expect(state.requireEventAdmin).toHaveBeenCalledWith('bench-netlex-2026', '/club/admin/events/bench-netlex-2026')
  expect(screen.getByRole('heading', { name: 'Inscrições · Bench: experiências com o NetLex' })).toBeInTheDocument()
  expect(screen.getByText('1 confirmada')).toBeInTheDocument()
  expect(screen.getByText('1 no Club')).toBeInTheDocument()
  expect(screen.getByText('ana@example.com')).toBeInTheDocument()
  expect(screen.getByText('Perfil ativo no Club')).toBeInTheDocument()
  expect(screen.getByText('Sem cadastro no Club')).toBeInTheDocument()
  expect(screen.getByText('Quer comparar integrações.')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Resumos do WhatsApp' })).toBeInTheDocument()
  expect(screen.getByText('Diariamente às 18h')).toBeInTheDocument()
})
