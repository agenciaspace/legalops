import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { loadLivePublicEvent } from '@/lib/public-event-live'

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'publishable')
})
afterEach(() => vi.unstubAllGlobals())

it('loads the current public event without a user session', async () => {
  const event = { id: 'event', slug: 'bench-honorarios-exito-2026', starts_at: '2026-10-14T22:00:00Z' }
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify([event]), { status: 200 }))
  vi.stubGlobal('fetch', fetch)
  await expect(loadLivePublicEvent(event.slug)).resolves.toEqual(event)
  const [url, init] = fetch.mock.calls[0]
  expect(String(url)).toContain('community_events')
  expect(String(url)).toContain('is_published=eq.true')
  expect(init.headers.Authorization).toBe('Bearer publishable')
})

it('falls back cleanly when the public database is unavailable', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('unavailable', { status: 503 })))
  await expect(loadLivePublicEvent('bench-honorarios-exito-2026')).resolves.toBeNull()
})
