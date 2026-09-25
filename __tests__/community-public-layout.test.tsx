import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({ user: null as null | { id: string }, member: null as null | Record<string, unknown> }))

vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    from: () => {
      const query: any = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: state.member }) }
      return query
    },
  }),
}))
vi.mock('@/components/community/ClubLanguage', () => ({ ClubLanguageSelect: () => <span>Language</span> }))
vi.mock('@/components/community/CommunityTabs', () => ({ CommunityTabs: () => <nav>Member sidebar</nav> }))
vi.mock('@/components/community/ClubPwa', () => ({ ClubPwa: () => null }))
vi.mock('@/components/community/ClubWelcomeNotice', () => ({ ClubWelcomeNotice: () => null }))
vi.mock('@/components/community/ProfileCompletionNotice', () => ({ ProfileCompletionNotice: () => null }))
vi.mock('@/components/community/AgentBubble', () => ({ AgentBubble: () => null }))
vi.mock('@/components/BrandLogo', () => ({ BrandWordmark: () => <span>legalops.club</span> }))
vi.mock('@/lib/club-locale-server', () => ({ getClubTranslator: () => (text: string) => text }))

import CommunityLayout from '@/app/(main)/community/layout'

beforeEach(() => { state.user = null; state.member = null })
afterEach(cleanup)

it('gives public event visitors a simple site header instead of the member sidebar', async () => {
  render(await CommunityLayout({ children: <p>Public event</p> }))
  expect(screen.getByText('legalops.club')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Entrar' })).toBeInTheDocument()
  expect(screen.queryByText('Member sidebar')).not.toBeInTheDocument()
})

it('preserves the community workspace for active members', async () => {
  state.user = { id: 'member' }
  state.member = { club_access_status: 'active', club_access_expires_at: null, club_pro_status: 'inactive', profile_verification_status: 'verified' }
  render(await CommunityLayout({ children: <p>Private event</p> }))
  expect(screen.getByText('Member sidebar')).toBeInTheDocument()
  expect(screen.queryByText('legalops.club')).not.toBeInTheDocument()
})
