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
