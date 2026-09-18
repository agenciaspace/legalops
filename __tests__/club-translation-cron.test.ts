// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const mocks = vi.hoisted(() => ({ admin: vi.fn() }))
vi.mock('@/lib/supabase-admin', () => ({ createAdminClient: mocks.admin }))
import { GET } from '@/app/api/cron/club-translations/route'
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks() })
it('rejects absent, empty and incorrect cron secrets before touching the queue', async () => {
  for (const [secret, bearer] of [['', 'Bearer undefined'], ['configured', 'Bearer wrong'], ['configured', '']]) {
    vi.stubEnv('CRON_SECRET', secret)
    const response = await GET(new NextRequest('https://legalops.club/api/cron/club-translations', { headers: { authorization: bearer } }))
    expect(response.status).toBe(401)
  }
  expect(mocks.admin).not.toHaveBeenCalled()
})
it('returns a bounded empty batch without calling the model', async () => {
  vi.stubEnv('CRON_SECRET', 'configured')
  const rpc = vi.fn(async () => ({ data: [], error: null }))
  mocks.admin.mockReturnValue({ rpc })
  const response = await GET(new NextRequest('https://legalops.club/api/cron/club-translations', { headers: { authorization: 'Bearer configured' } }))
  expect(await response.json()).toEqual({ processed: 0, ready: 0, failed: 0 })
  expect(rpc).toHaveBeenCalledWith('claim_club_translations', { batch_size: 3 })
})
