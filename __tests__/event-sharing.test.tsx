vi.mock('next/navigation',()=>({useRouter:()=>({refresh:vi.fn()})}))
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { clubReturnPath } from '@/lib/club-return-path'

const state = vi.hoisted(() => ({ user: null as null | { id: string }, member: null as any, tables: [] as string[], location: '' }))
vi.mock('@/app/(main)/community/actions', () => ({ registerPublicEvent: vi.fn() }))
vi.mock('@/components/community/EventUpload', () => ({ EventUpload: () => <p>Private upload</p> }))
vi.mock('@/lib/supabase-server', () => ({ createServerSupabaseClient: async () => ({
  auth: { getUser: async () => ({ data: { user: state.user } }) },
  from: (table: string) => {
    state.tables.push(table)
    const data = table === 'community_events' ? { id: 'event', slug: 'bench-nubank', title: 'Bench & contratos', description: 'Conversa prática sobre contratos.', host_name: 'LegalOps Club', starts_at: '2026-12-17T12:00:00Z', ends_at: null, location_label: state.location, event_type: 'encontro', is_published: true, participation_mode: 'remoto', participation_details: 'Os detalhes serão enviados às pessoas inscritas.', pre_questions: ['Como funciona hoje?'] } : table === 'community_members' ? state.member : null
    const query: any = { select: () => query, eq: () => query, maybeSingle: async () => ({ data }) }
    return query
  },
}) }))
import EventPage, { generateMetadata } from '@/app/(main)/community/events/[slug]/page'

beforeEach(() => { state.user = null; state.member = null; state.tables = []; state.location = '' })
afterEach(cleanup)

it.each([false, true])('invites a nonmember to join without reading private materials (signed in: %s)', async signedIn => {
  if (signedIn) state.user = { id: 'inactive-member' }
  render(await EventPage({ params: { slug: 'bench-nubank' } }))
  expect(screen.getByRole('heading', { name: 'Reserve sua vaga' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: new RegExp(signedIn ? 'Completar meu cadastro' : 'Conhecer a comunidade') })).toHaveAttribute('href', '/club/entrar?next=%2Fcommunity%2Fevents%2Fbench-nubank')
  expect(state.tables).not.toContain('community_event_resources')
  expect(state.tables).not.toContain('community_posts')
  expect(screen.queryByText('Private upload')).not.toBeInTheDocument()
  const share = new URL(screen.getAllByRole('link', { name: 'Compartilhar no WhatsApp' })[0].getAttribute('href')!)
  expect(share.origin).toBe('https://wa.me')
  expect(share.searchParams.get('text')).toContain('https://legalops.club/community/events/bench-nubank')
  expect(share.searchParams.get('text')).toContain('Bench & contratos')
  expect(share.searchParams.get('text')).toMatch(/^\*Bench & contratos\*\n\nParticipe de uma conversa prática/)
  expect(share.searchParams.get('text')).toContain('Veja os detalhes e reserve sua vaga:\nhttps://legalops.club/community/events/bench-nubank')
})

it('keeps public registration open while the event date is still being confirmed', async () => {
  state.location = 'Remoto — data a confirmar'
  render(await EventPage({ params: { slug: 'bench-nubank' } }))
  expect(screen.getByText('Data a confirmar')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Reserve sua vaga' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Quero participar/ })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Sobre o encontro' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'O que vamos discutir?' })).toBeInTheDocument()
})

it('turns the post-registration page into a clear confirmation state', async () => {
  state.location = 'Remoto — data a confirmar'
  render(await EventPage({ params: { slug: 'bench-nubank' }, searchParams: { registered: '1' } }))
  expect(screen.getByRole('heading', { name: 'Seu interesse está confirmado.' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Quero participar/ })).not.toBeInTheDocument()
})

it('publishes event-specific metadata for links and search results', async () => {
  const metadata = await generateMetadata({ params: { slug: 'bench-nubank' } })
  expect(metadata.title).toBe('Bench & contratos | legalops.club')
  expect(metadata.alternates).toEqual({ canonical: 'https://legalops.club/community/events/bench-nubank' })
})

it('accepts event destinations and rejects external, management and encoded redirect paths', () => {
  expect(clubReturnPath('/community/events/bench-nubank')).toBe('/community/events/bench-nubank')
  for (const value of ['https://evil.test', '//evil.test', '/community/events/manage', '/community/events/../manage', '/community/events/%2f%2fevil.test', '/community/events/x?next=//evil.test']) expect(clubReturnPath(value)).toBeNull()
})
