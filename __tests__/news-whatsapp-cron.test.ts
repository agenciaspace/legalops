// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const state = vi.hoisted(() => ({ dispatch: vi.fn() }))
vi.mock('@/lib/news-whatsapp-dispatch', () => ({ dispatchNewsWhatsapp: state.dispatch }))
import { GET } from '@/app/api/cron/news-whatsapp/route'
beforeEach(() => { delete process.env.CRON_SECRET; state.dispatch.mockReset() })
it('fails closed before touching the queue for missing or incorrect credentials', async () => {
  expect((await GET(new NextRequest('https://legalops.work/api/cron/news-whatsapp'))).status).toBe(401)
  process.env.CRON_SECRET = 'fixture'
  expect((await GET(new NextRequest('https://legalops.work/api/cron/news-whatsapp', { headers: { authorization: 'Bearer wrong' } }))).status).toBe(401)
  expect(state.dispatch).not.toHaveBeenCalled()
})
it('reports an unconfigured integration without sending', async () => {
  process.env.CRON_SECRET = 'fixture'; state.dispatch.mockResolvedValue({ state: 'awaiting_connection', processed: 0 })
  const response = await GET(new NextRequest('https://legalops.work/api/cron/news-whatsapp', { headers: { authorization: 'Bearer fixture' } }))
  expect(response.headers.get('cache-control')).toBe('private, no-store')
  expect(await response.json()).toMatchObject({ state: 'awaiting_connection', processed: 0 })
})
