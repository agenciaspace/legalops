// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const state = vi.hoisted(() => ({ user: { id: 'owner' } as { id: string } | null, active: true,
  save: vi.fn(), remove: vi.fn(), status: vi.fn(), ready: true }))
vi.mock('@/lib/supabase-server', () => ({ createServerSupabaseClient: async () => ({
  auth: { getUser: async () => ({ data: { user: state.user } }) },
  from: () => { const q: any = { select: () => q, eq: () => q,
    maybeSingle: async () => ({ data: { club_access_status: state.active ? 'active' : 'inactive' }, error: null }) }; return q },
}) }))
vi.mock('@/lib/club-api-key', async importOriginal => ({ ...await importOriginal<typeof import('@/lib/club-api-key')>(),
  saveMemberKey: state.save, removeMemberKey: state.remove, memberKeyStatus: state.status, memberKeyStorageReady: () => state.ready,
}))
import { GET, PUT, DELETE } from '@/app/api/club/api-key/route'
const key = 'sk-proj-test-key-for-unit-testing-only'
const request = (body: unknown, method = 'PUT', origin = 'https://legalops.club') => new NextRequest('https://legalops.club/api/club/api-key', {
  method, headers: { origin, 'Content-Type': 'application/json' }, ...(method === 'PUT' ? { body: JSON.stringify(body) } : {}),
})
beforeEach(() => { vi.clearAllMocks(); state.user = { id: 'owner' }; state.active = true; state.ready = true; state.status.mockResolvedValue(null); state.save.mockResolvedValue({ provider: 'openai', model: 'gpt-4.1-mini', last_four: 'only' }) })

it('rejects anonymous reads, saves, and removal without touching credentials', async () => {
  state.user = null
  expect((await GET()).status).toBe(401)
  expect((await PUT(request({ api_key: key, consent: true }))).status).toBe(401)
  expect((await DELETE(request(null, 'DELETE'))).status).toBe(401)
  expect(state.save).not.toHaveBeenCalled(); expect(state.remove).not.toHaveBeenCalled(); expect(state.status).not.toHaveBeenCalled()
})
it('requires active membership to save but allows removal after membership expires', async () => {
  state.active = false
  expect((await PUT(request({ api_key: key, consent: true }))).status).toBe(403)
  expect((await DELETE(request(null, 'DELETE'))).status).toBe(200)
  expect(state.remove).toHaveBeenCalledWith('owner'); expect(state.save).not.toHaveBeenCalled()
})
it('requires same-origin requests, explicit consent and bounded valid credentials', async () => {
  expect((await PUT(request({ api_key: key, consent: true }, 'PUT', 'https://evil.example'))).status).toBe(403)
  expect((await PUT(request({ api_key: key }))).status).toBe(400)
  expect((await PUT(request({ api_key: 'sk-abc\nheader', consent: true }))).status).toBe(400)
  expect((await PUT(request({ api_key: 'x'.repeat(3000), consent: true }))).status).toBe(413)
  expect(state.save).not.toHaveBeenCalled()
})
it('ignores forged owner and provider parameters and never returns the credential', async () => {
  const response = await PUT(request({ api_key: key, consent: true, user_id: 'victim', endpoint: 'https://evil.example' }))
  expect(response.status).toBe(200)
  expect(state.save).toHaveBeenCalledWith('owner', key)
  expect(await response.text()).not.toContain(key)
  expect(response.headers.get('cache-control')).toContain('no-store')
})
it('reads only the authenticated owner metadata and suppresses unexpected errors', async () => {
  expect((await GET()).status).toBe(200); expect(state.status).toHaveBeenCalledWith('owner')
  state.save.mockRejectedValueOnce(new Error(key))
  const response = await PUT(request({ api_key: key, consent: true }))
  expect(response.status).toBe(503); expect(await response.text()).not.toContain(key)
})
it('does not validate or persist keys until encryption is configured', async () => {
  state.ready = false
  expect((await PUT(request({ api_key: key, consent: true }))).status).toBe(503)
  expect(state.save).not.toHaveBeenCalled()
})
