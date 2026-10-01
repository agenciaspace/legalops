// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const auth = vi.hoisted(() => ({ exchangeCodeForSession: vi.fn(), verifyOtp: vi.fn() }))
vi.mock('@/lib/supabase-server', () => ({ createServerSupabaseClient: async () => ({ auth }) }))
vi.mock('@/lib/welcome-email', () => ({ sendWelcomeEmailIfNeeded: vi.fn(), sendClubWelcomeEmailIfNeeded: vi.fn() }))
import { GET } from '@/app/auth/confirm/route'
beforeEach(() => { vi.resetAllMocks(); auth.exchangeCodeForSession.mockResolvedValue({ data: {}, error: null }); auth.verifyOtp.mockResolvedValue({ data: {}, error: null }) })
it('exchanges a PKCE code and continues to the Club profile', async () => {
  const response = await GET(new NextRequest('https://legalops.club/auth/confirm?code=test&next=/club/entrar'))
  expect(auth.exchangeCodeForSession).toHaveBeenCalledWith('test')
  expect(response.headers.get('location')).toBe('https://legalops.club/club/entrar')
})
it('accepts existing token-hash links without allowing external redirects', async () => {
  const response = await GET(new NextRequest('https://legalops.club/auth/confirm?token_hash=test&type=email&next=//example.com'))
  expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: 'test', type: 'email' })
  expect(response.headers.get('location')).toBe('https://legalops.club/club/entrar')
})
it('rejects failed confirmation', async () => {
  auth.exchangeCodeForSession.mockResolvedValue({ data: {}, error: { message: 'expired' } })
  expect((await GET(new NextRequest('https://legalops.club/auth/confirm?code=expired'))).headers.get('location')).toContain('error=confirmation_failed')
})
it('accepts magic links and preserves the requested destination', async () => {
  const response = await GET(new NextRequest('https://legalops.club/auth/confirm?token_hash=test&type=magiclink&next=/community/calendar'))
  expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: 'test', type: 'magiclink' })
  expect(response.headers.get('location')).toBe('https://legalops.club/community/calendar')
})
it('keeps recovery on the password form with the original destination', async () => {
  const next = '/set-password?next=%2Fcommunity%2Fcalendar'
  const response = await GET(new NextRequest(`https://legalops.club/auth/confirm?token_hash=test&type=recovery&next=${encodeURIComponent(next)}`))
  expect(response.headers.get('location')).toBe(`https://legalops.club${next}`)
})
it('preserves the destination when a recovery link has expired', async () => {
  auth.verifyOtp.mockResolvedValue({ data: {}, error: { message: 'expired' } })
  const next = '/set-password?next=%2Fcommunity%2Fcalendar'
  const response = await GET(new NextRequest(`https://legalops.club/auth/confirm?token_hash=test&type=recovery&next=${encodeURIComponent(next)}`))
  const url = new URL(response.headers.get('location')!)
  expect(url.pathname).toBe('/login')
  expect(url.searchParams.get('next')).toBe('/community/calendar')
})
it.each(['//evil.test', '/\\evil.test', '/\t/evil.test'])('rejects unsafe redirect %s', async next => {
  const response = await GET(new NextRequest(`https://legalops.club/auth/confirm?token_hash=test&type=email&next=${encodeURIComponent(next)}`))
  expect(response.headers.get('location')).toBe('https://legalops.club/club/entrar')
})
