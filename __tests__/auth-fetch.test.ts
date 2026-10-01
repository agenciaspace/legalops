// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest'
import { authFetch } from '@/lib/auth-fetch'
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })
it('aborts a stalled authentication request after twenty seconds', async () => {
  vi.useFakeTimers()
  const fetchMock = vi.fn((_input, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
  }))
  vi.stubGlobal('fetch', fetchMock)
  const result = expect(authFetch('https://project.supabase.co/auth/v1/recover')).rejects.toThrow('Aborted')
  await vi.advanceTimersByTimeAsync(20000)
  await result
  expect(vi.getTimerCount()).toBe(0)
})
it('does not impose the auth timeout on uploads or database requests', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response('{}'))
  vi.stubGlobal('fetch', fetchMock)
  const init = { method: 'POST' }
  await authFetch('https://project.supabase.co/storage/v1/object/photos', init)
  expect(fetchMock).toHaveBeenCalledWith('https://project.supabase.co/storage/v1/object/photos', init)
})
it('preserves caller cancellation and clears the timer on success', async () => {
  vi.useFakeTimers()
  const controller = new AbortController(); controller.abort()
  const fetchMock = vi.fn().mockResolvedValue(new Response('{}'))
  vi.stubGlobal('fetch', fetchMock)
  await authFetch('https://project.supabase.co/auth/v1/otp', { signal: controller.signal })
  expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true)
  expect(vi.getTimerCount()).toBe(0)
})
