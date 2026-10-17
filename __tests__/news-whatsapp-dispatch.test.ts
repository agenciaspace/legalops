// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
const state = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), admin: vi.fn(), sender: vi.fn(), update: vi.fn() }))
vi.mock('@/lib/supabase-admin', () => ({ createAdminClient: () => { state.admin(); return { rpc: state.rpc, from: state.from } } }))
vi.mock('@/lib/news-whatsapp', async importOriginal => ({ ...await importOriginal<typeof import('@/lib/news-whatsapp')>(), sendNewsWhatsapp: state.sender }))
import { dispatchNewsWhatsapp } from '@/lib/news-whatsapp-dispatch'
beforeEach(() => {
  vi.stubEnv('NEWS_WHATSAPP_ENABLED', 'true'); vi.stubEnv('NEWS_WHATSAPP_INSTANCE_URL', 'https://instance.example'); vi.stubEnv('NEWS_WHATSAPP_INSTANCE_TOKEN', 'fixture'); vi.stubEnv('NEWS_WHATSAPP_GROUP_ID', '120363000000000000@g.us')
  vi.clearAllMocks()
  state.rpc.mockResolvedValue({ data: [{ id: 'delivery', article_id: 'article', claim_token: 'fence' }], error: null })
  const chain = { eq: vi.fn((key: string) => key === 'status' ? Promise.resolve({ error: null }) : chain) }
  state.update.mockReturnValue(chain)
  state.from.mockImplementation((table: string) => table === 'news_articles'
    ? { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { status: 'draft' }, error: null }) }) }) }
    : { update: state.update })
})
afterEach(() => vi.unstubAllEnvs())
it('never claims or touches the database while the target is unconfigured', async () => {
  vi.stubEnv('NEWS_WHATSAPP_ENABLED', 'false')
  expect(await dispatchNewsWhatsapp()).toEqual({ state: 'awaiting_connection', processed: 0 })
  expect(state.admin).not.toHaveBeenCalled(); expect(state.sender).not.toHaveBeenCalled()
})
it('cancels a claimed story that was unpublished instead of sending it', async () => {
  expect(await dispatchNewsWhatsapp()).toMatchObject({ processed: 1, results: ['cancelled'] })
  expect(state.sender).not.toHaveBeenCalled()
  expect(state.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'cancelled', error_code: 'article_not_public' }))
})
it('records provider acceptance only after rechecking publication', async () => {
  state.from.mockImplementation((table: string) => table === 'news_articles'
    ? { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { status: 'published', published_at: '2026-01-01', title: 'Published', summary: 'Summary', slug: 'published-story' }, error: null }) }) }) }
    : { update: state.update })
  state.sender.mockResolvedValue({ state: 'accepted', messageId: 'provider-id', code: null })
  expect(await dispatchNewsWhatsapp()).toMatchObject({ processed: 1, results: ['accepted'] })
  expect(state.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'accepted', provider_message_id: 'provider-id' }))
})
