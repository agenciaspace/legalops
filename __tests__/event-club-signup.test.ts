import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  generateLink: vi.fn(),
  deleteUser: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  sendEmail: vi.fn(),
}))

vi.mock('@/lib/supabase-admin', () => ({
  createAdminClient: () => ({
    auth: { admin: { generateLink: mocks.generateLink, deleteUser: mocks.deleteUser } },
    from: () => ({ update: mocks.update }),
  }),
}))
vi.mock('@/lib/welcome-email', () => ({ sendEventClubSignupEmail: mocks.sendEmail }))

import { requestEventClubSignup } from '@/lib/event-club-signup'

const input = {
  email: 'ana@example.com',
  name: 'Ana Lima',
  role: 'Legal Ops',
  organization: 'Empresa A',
  eventSlug: 'bench-netlex-2026',
  eventTitle: 'Bench: experiências com o NetLex',
  locale: 'pt-BR',
}

beforeEach(() => {
  mocks.eq.mockResolvedValue({ error: null })
  mocks.update.mockReturnValue({ eq: mocks.eq })
  mocks.deleteUser.mockResolvedValue({ error: null })
  mocks.sendEmail.mockResolvedValue({ messageId: 'mail-1' })
  mocks.generateLink.mockResolvedValue({
    data: {
      user: { id: 'user-1' },
      properties: { action_link: 'https://project.supabase.co/auth/v1/verify?token=abc' },
    },
    error: null,
  })
})
afterEach(() => vi.clearAllMocks())

it('creates a separate Club activation without granting access automatically', async () => {
  await expect(requestEventClubSignup(input)).resolves.toEqual({ status: 'confirmation_sent', userId: 'user-1' })
  expect(mocks.generateLink).toHaveBeenCalledWith(expect.objectContaining({
    type: 'signup',
    email: input.email,
    options: expect.objectContaining({
      redirectTo: expect.stringContaining(encodeURIComponent('/set-password?next=')),
      data: expect.objectContaining({ signup_source: 'event', event_slug: input.eventSlug }),
    }),
  }))
  expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
    full_name: input.name,
    current_role: input.role,
    organization_name: input.organization,
  }))
  expect(mocks.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ eventTitle: input.eventTitle }))
})

it('directs an existing account to sign in without changing it', async () => {
  mocks.generateLink.mockResolvedValue({ data: {}, error: { status: 422, code: 'email_exists', message: 'User already registered' } })
  await expect(requestEventClubSignup(input)).resolves.toEqual({ status: 'existing_account' })
  expect(mocks.update).not.toHaveBeenCalled()
  expect(mocks.sendEmail).not.toHaveBeenCalled()
})

it('removes an undelivered new account while preserving the event registration', async () => {
  mocks.sendEmail.mockRejectedValue(new Error('delivery failed'))
  await expect(requestEventClubSignup(input)).resolves.toEqual({ status: 'error', error: 'email_delivery_failed' })
  expect(mocks.deleteUser).toHaveBeenCalledWith('user-1')
})
