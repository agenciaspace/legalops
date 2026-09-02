import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  sendWelcomeEmailIfNeeded,
  sendClubWelcomeEmailIfNeeded,
  sendClubInvitationEmail,
} from '@/lib/welcome-email'

const sendCloudflareTransactionalEmailMock =
  vi.fn(async (_input: unknown) => ({ messageId: 'msg-1', payload: {} }))

vi.mock('@/lib/cloudflare-email', () => ({
  sendCloudflareTransactionalEmail: (input: unknown) =>
    sendCloudflareTransactionalEmailMock(input),
}))

vi.mock('@/lib/supabase-admin', () => ({
  createAdminClient: () => adminClient,
}))

function chainableClient(rows: unknown[] | null, updateResult: unknown = [{ user_id: 'user-1' }]) {
  const client = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({ data: rows?.[0] ?? null, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          is: vi.fn(() => ({
            select: vi.fn(async () => ({ data: updateResult, error: null })),
          })),
        })),
      })),
    })),
  }
  return client
}

let adminClient: ReturnType<typeof chainableClient>

const ACTIVE_MEMBER = {
  display_name: 'Ana Souza',
  club_access_status: 'complimentary',
  club_access_expires_at: null,
  club_welcome_email_sent_at: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  adminClient = chainableClient([ACTIVE_MEMBER])
})

describe('sendClubInvitationEmail', () => {
  it('sends the generated Auth link through the configured transactional channel', async () => {
    await sendClubInvitationEmail({
      email: 'ana@example.com',
      actionLink: 'https://project.supabase.co/auth/v1/verify?token=abc&type=invite',
    })

    expect(sendCloudflareTransactionalEmailMock).toHaveBeenCalledWith(expect.objectContaining({
      to: ['ana@example.com'],
      subject: 'Seu convite para o LegalOps Club',
      textBody: expect.stringContaining('token=abc'),
      htmlBody: expect.stringContaining('href="https://project.supabase.co/auth/v1/verify?token=abc&amp;type=invite"'),
    }))
  })
})

describe('sendWelcomeEmailIfNeeded', () => {
  it('returns false when the user has no profile row', async () => {
    adminClient = chainableClient(null)

    await expect(sendWelcomeEmailIfNeeded({ id: 'user-1', email: 'ana@example.com' })).resolves.toBe(false)
    expect(sendCloudflareTransactionalEmailMock).not.toHaveBeenCalled()
  })

  it('returns false when the welcome email was already sent', async () => {
    adminClient = chainableClient([
      { welcome_email_sent_at: '2026-08-19T12:00:00.000Z' },
    ])

    await expect(sendWelcomeEmailIfNeeded({ id: 'user-1', email: 'ana@example.com' })).resolves.toBe(false)
    expect(sendCloudflareTransactionalEmailMock).not.toHaveBeenCalled()
  })

  it('sends the account welcome and marks it as sent', async () => {
    adminClient = chainableClient([{ welcome_email_sent_at: null }])

    await expect(sendWelcomeEmailIfNeeded({ id: 'user-1', email: 'ana@example.com' })).resolves.toBe(true)
    expect(sendCloudflareTransactionalEmailMock).toHaveBeenCalledWith({
      to: ['ana@example.com'],
      subject: 'Sua conta LegalOps está pronta',
      textBody: expect.stringContaining('https://legalops.work/dashboard'),
      htmlBody: expect.stringContaining('<p>'),
    })
  })
})

describe('sendClubWelcomeEmailIfNeeded', () => {
  it('returns false when the user is not a club member', async () => {
    adminClient = chainableClient(null)

    await expect(sendClubWelcomeEmailIfNeeded({ id: 'user-1', email: 'ana@example.com' })).resolves.toBe(false)
    expect(sendCloudflareTransactionalEmailMock).not.toHaveBeenCalled()
  })

  it('returns false when club access is not active', async () => {
    adminClient = chainableClient([
      { ...ACTIVE_MEMBER, club_access_status: 'free' },
    ])

    await expect(sendClubWelcomeEmailIfNeeded({ id: 'user-1', email: 'ana@example.com' })).resolves.toBe(false)
    expect(sendCloudflareTransactionalEmailMock).not.toHaveBeenCalled()
  })

  it('returns false when access has expired', async () => {
    adminClient = chainableClient([
      { ...ACTIVE_MEMBER, club_access_expires_at: '2026-08-01T00:00:00.000Z' },
    ])

    await expect(sendClubWelcomeEmailIfNeeded({ id: 'user-1', email: 'ana@example.com' })).resolves.toBe(false)
    expect(sendCloudflareTransactionalEmailMock).not.toHaveBeenCalled()
  })

  it('returns false when the club welcome was already sent', async () => {
    adminClient = chainableClient([
      { ...ACTIVE_MEMBER, club_welcome_email_sent_at: '2026-08-19T12:00:00.000Z' },
    ])

    await expect(sendClubWelcomeEmailIfNeeded({ id: 'user-1', email: 'ana@example.com' })).resolves.toBe(false)
    expect(sendCloudflareTransactionalEmailMock).not.toHaveBeenCalled()
  })

  it('sends the club welcome with the member name and marks it as sent', async () => {
    const sent = await sendClubWelcomeEmailIfNeeded({ id: 'user-1', email: 'ana@example.com' })

    expect(sent).toBe(true)
    expect(sendCloudflareTransactionalEmailMock).toHaveBeenCalledWith({
      to: ['ana@example.com'],
      subject: 'Bem-vindo ao LegalOps Club',
      textBody: expect.stringContaining('https://legalops.club/community/profile'),
      htmlBody: expect.stringContaining('<p>'),
    })
  })

  it('greets the member by display name', async () => {
    const sent = await sendClubWelcomeEmailIfNeeded({ id: 'user-1', email: 'ana@example.com' })

    expect(sent).toBe(true)
    expect(sendCloudflareTransactionalEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ textBody: expect.stringContaining('Olá, Ana Souza!') })
    )
  })

  it('falls back to a neutral greeting without a display name', async () => {
    adminClient = chainableClient([{ ...ACTIVE_MEMBER, display_name: null }])

    const sent = await sendClubWelcomeEmailIfNeeded({ id: 'user-1', email: 'ana@example.com' })

    expect(sent).toBe(true)
    expect(sendCloudflareTransactionalEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ textBody: expect.stringContaining('Olá!') })
    )
  })
})
