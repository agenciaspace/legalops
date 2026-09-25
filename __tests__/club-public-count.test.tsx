import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ count: 12, error: null as Error | null }))

vi.mock('@/lib/supabase-admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        in: () => ({
          or: () => ({
            abortSignal: async () => ({ count: mocks.count, error: mocks.error }),
          }),
        }),
      }),
    }),
  }),
}))
vi.mock('@/components/BrandLogo', () => ({ BrandWordmark: () => <span>legalops.club</span> }))
vi.mock('@/components/LegalOpsEcosystem', () => ({ LegalOpsEcosystem: () => null }))
vi.mock('@/components/community/ResumeClubSession', () => ({ ResumeClubSession: () => null }))

import ClubLandingPage from '@/app/club/page'

it('shows the active community count in the public header', async () => {
  render(await ClubLandingPage())
  expect(screen.getByText('12 pessoas na comunidade')).toBeInTheDocument()
})
