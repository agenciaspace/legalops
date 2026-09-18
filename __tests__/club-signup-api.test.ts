// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  signUp: vi.fn(),
  generateLink: vi.fn(),
  deleteUser: vi.fn(),
  sendConfirmation: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ auth: { signUp: mocks.signUp } }),
}))
vi.mock('@/lib/supabase-admin', () => ({
  createAdminClient: () => ({
    auth: { admin: { generateLink: mocks.generateLink, deleteUser: mocks.deleteUser } },
  }),
}))
vi.mock('@/lib/welcome-email', () => ({
  sendSignupConfirmationEmail: (input: unknown) => mocks.sendConfirmation(input),
}))

import { POST } from '@/app/api/auth/signup/route'

const request = (body: unknown) => new NextRequest('https://legalops.club/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'publishable')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role')
  mocks.signUp.mockResolvedValue({ data: { session: null }, error: null })
  mocks.deleteUser.mockResolvedValue({ error: null })
  mocks.sendConfirmation.mockResolvedValue({ messageId: 'message-1' })
})

it('uses the normal Supabase confirmation path when SMTP succeeds', async () => {
  const response = await POST(request({ email: 'ANA@example.com', password: 'floresta', next: '/club/entrar' }))

  expect(response.status).toBe(200)
  expect(mocks.signUp).toHaveBeenCalledWith(expect.objectContaining({ email: 'ana@example.com' }))
  expect(mocks.generateLink).not.toHaveBeenCalled()
})

it('generates and delivers a confirmation link when Supabase SMTP fails', async () => {
  mocks.signUp.mockResolvedValue({ data: { session: null }, error: { status: 500, code: 'unexpected_failure', message: 'Error sending confirmation email' } })
  mocks.generateLink.mockResolvedValue({
    data: { user: { id: 'user-1' }, properties: { hashed_token: 'secret-hash' } },
    error: null,
  })

  const response = await POST(request({
    email: 'ana@example.com',
    password: 'floresta',
    next: '/club/entrar?next=%2Fcommunity%2Fevents%2Fbench-nubank-2026',
  }))

  expect(response.status).toBe(200)
  await expect(response.json()).resolves.toEqual({ ok: true, fallback: true })
  expect(mocks.sendConfirmation).toHaveBeenCalledWith({
    email: 'ana@example.com',
    confirmationLink: expect.stringContaining('token_hash=secret-hash&type=email&next='),
    locale: 'pt-BR',
  })
})

it('removes a newly created account if fallback delivery fails', async () => {
  mocks.signUp.mockResolvedValue({ data: {}, error: { status: 500, code: 'unexpected_failure', message: 'Error sending confirmation email' } })
  mocks.generateLink.mockResolvedValue({ data: { user: { id: 'user-1' }, properties: { hashed_token: 'hash' } }, error: null })
  mocks.sendConfirmation.mockRejectedValue(new Error('provider rejected'))

  const response = await POST(request({ email: 'ana@example.com', password: 'floresta' }))

  expect(response.status).toBe(502)
  expect(mocks.deleteUser).toHaveBeenCalledWith('user-1')
})

it('preserves Supabase rate limiting and does not use the fallback for other errors', async () => {
  mocks.signUp.mockResolvedValue({ data: {}, error: { status: 429, code: 'over_email_send_rate_limit', message: 'rate limit' } })

  const response = await POST(request({ email: 'ana@example.com', password: 'floresta' }))

  expect(response.status).toBe(429)
  await expect(response.json()).resolves.toEqual({ code: 'over_email_send_rate_limit' })
  expect(mocks.generateLink).not.toHaveBeenCalled()
})
