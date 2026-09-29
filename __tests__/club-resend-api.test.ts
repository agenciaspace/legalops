// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({ resend: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ auth: { resend: mocks.resend } }) }))

import { POST } from '@/app/api/auth/resend/route'

const request = (body: unknown) => new NextRequest('https://legalops.club/api/auth/resend', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'publishable')
  mocks.resend.mockResolvedValue({ error: null })
})

it('resends signup confirmation with the safe Club return path', async () => {
  const response = await POST(request({ email: ' ANA@example.com ', next: '/club/entrar?next=%2Fcommunity%2Fevents%2Fbench-honorarios-exito-2026' }))
  expect(response.status).toBe(200)
  expect(mocks.resend).toHaveBeenCalledWith({
    type: 'signup',
    email: 'ana@example.com',
    options: { emailRedirectTo: 'https://legalops.club/auth/confirm?next=%2Fclub%2Fentrar%3Fnext%3D%252Fcommunity%252Fevents%252Fbench-honorarios-exito-2026' },
  })
})

it('preserves provider rate limits', async () => {
  mocks.resend.mockResolvedValue({ error: { code: 'over_email_send_rate_limit', status: 429 } })
  const response = await POST(request({ email: 'ana@example.com' }))
  expect(response.status).toBe(429)
  await expect(response.json()).resolves.toEqual({ code: 'over_email_send_rate_limit' })
})
