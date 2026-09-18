import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ user: { id: 'member' } as { id: string } | null, member: { club_access_status: 'complimentary', club_access_expires_at: null } as any, rpc: vi.fn() }))
vi.mock('@/lib/supabase-server', () => ({ createServerSupabaseClient: async () => ({ auth: { getUser: async () => ({ data: { user: mocks.user } }) }, from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: mocks.member }) }) }) }), rpc: mocks.rpc }) }))
import { POST } from '@/app/api/community/contract-map/route'
const content = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Example' }] }] }
const proposal = { action: 'suggest', section: 'contexto', version: 1, content, note: 'Explain contribution', license: true }
const post = (body: unknown) => POST(new Request('https://legalops.club/api/community/contract-map', { method: 'POST', headers: { 'Content-Type': 'application/json', origin: 'https://legalops.club' }, body: JSON.stringify(body) }))
beforeEach(() => { mocks.user = { id: 'member' }; mocks.member = { club_access_status: 'complimentary', club_access_expires_at: null }; mocks.rpc.mockReset().mockResolvedValue({ data: 'ok', error: null }) })
describe('Contract map permission boundary', () => {
  it('requires login', async () => { mocks.user = null; expect((await post(proposal)).status).toBe(401); expect(mocks.rpc).not.toHaveBeenCalled() })
  it('requires active membership', async () => { mocks.member = null; expect((await post(proposal)).status).toBe(403); expect(mocks.rpc).not.toHaveBeenCalled() })
  it('requires explicit publishing license for suggestions', async () => { expect((await post({ ...proposal, license: false })).status).toBe(400); expect(mocks.rpc).not.toHaveBeenCalled() })
  it('sends a suggestion with the authenticated RPC and no supplied author', async () => { expect((await post({ ...proposal, author_id: 'spoof' })).status).toBe(200); expect(mocks.rpc).toHaveBeenCalledWith('contract_map_contribute', expect.objectContaining({ p_kind: 'suggestion', p_version: 1, p_license: true })); expect(mocks.rpc.mock.calls[0][1]).not.toHaveProperty('author_id') })
  it('returns a recoverable version conflict', async () => { mocks.rpc.mockResolvedValue({ error: { message: 'VERSION_CONFLICT' } }); const result = await post(proposal); expect(result.status).toBe(409); expect((await result.json()).conflict).toBe(true) })
  it('does not trust a client lead flag', async () => { mocks.rpc.mockResolvedValue({ error: { message: 'LEAD_REQUIRED' } }); expect((await post({ ...proposal, action: 'publish', isLead: true })).status).toBe(403) })
  it('rejects unsafe content before the database', async () => { expect((await post({ ...proposal, content: { type: 'html', text: '<script>' } })).status).toBe(400); expect(mocks.rpc).not.toHaveBeenCalled() })
})
