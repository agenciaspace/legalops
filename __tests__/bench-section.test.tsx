vi.mock('next/navigation',()=>({useRouter:()=>({refresh:vi.fn()})}))
import type {} from '@/lib/club-translations'
vi.mock('@/lib/club-translations',()=>({loadClubTranslations:async()=>({enabled:false,sources:new Map()})}))
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
const state = vi.hoisted(() => ({ rows: [] as any[], error: null as any }))
vi.mock('@/lib/supabase-server', () => ({ createServerSupabaseClient: async () => ({ from: () => {
  const query: any = { select: () => query, eq: () => query, ilike: () => query, order: () => query, limit: async () => ({ data: state.rows, error: state.error }) }
  return query
} }) }))
import BenchSection from '@/app/(main)/community/calendar/BenchSection'
afterEach(() => { cleanup(); state.rows = []; state.error = null })
it('shows future and completed Bench meetings with direct links to each event and materials', async () => {
  state.rows = [
    { id: 'future', slug: 'bench-outro', title: 'Outro encontro', starts_at: '2099-01-01T12:00:00Z' },
    { id: 'past', slug: 'bench-anterior', title: 'Encontro anterior', starts_at: '2020-01-01T12:00:00Z' },
  ]
  render(await BenchSection())
  expect(screen.getByRole('heading', { name: 'Próximos encontros' })).toBeVisible()
  expect(screen.getByRole('heading', { name: 'Encontros realizados' })).toBeVisible()
  expect(screen.getByRole('link', { name: 'Ver encontro e participar' })).toHaveAttribute('href', '/community/events/bench-outro')
  expect(screen.getByRole('link', { name: 'Fotos' })).toHaveAttribute('href', '/community/events/bench-anterior?tab=fotos#publicacoes')
  expect(screen.getByRole('link', { name: 'Documentos' })).toHaveAttribute('href', '/community/events/bench-anterior?tab=documentos#publicacoes')
  expect(screen.getAllByRole('link', { name: 'Compartilhar no WhatsApp' })).toHaveLength(2)
})
it('reports a failed event query rather than claiming there are no meetings', async () => {
  state.error = { message: 'offline' }
  render(await BenchSection())
  expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar')
})
