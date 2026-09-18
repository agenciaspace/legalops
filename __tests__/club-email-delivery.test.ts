import { afterEach, expect, it, vi } from 'vitest'
import { sendClubTransactionalEmail } from '@/lib/club-email-delivery'
import { buildClubEmail } from '@/lib/club-email'

const fallback = vi.hoisted(() => vi.fn(async () => ({ messageId: 'fallback', payload: {} })))
vi.mock('@/lib/cloudflare-email', () => ({ sendCloudflareTransactionalEmail: fallback }))
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.clearAllMocks() })
const message = { to: ['delivered@resend.dev'], subject: 'Welcome', textBody: 'Welcome', htmlBody: '<p>Welcome</p>', idempotencyKey: 'welcome/test' }

it('sends HTML and plain text with the Club identity and stable retry key', async () => {
  vi.stubEnv('RESEND_API_KEY', 'test-only-key')
  const fetchMock = vi.fn(async () => Response.json({ id: 'message-id' }))
  vi.stubGlobal('fetch', fetchMock)
  await expect(sendClubTransactionalEmail(message)).resolves.toMatchObject({ messageId: 'message-id' })
  const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
  expect(url).toBe('https://api.resend.com/emails')
  expect(init.headers).toMatchObject({ 'Idempotency-Key': 'welcome/test' })
  expect(JSON.parse(init.body as string)).toMatchObject({ from: 'legalops.club <contato@legalops.club>', html: message.htmlBody, text: message.textBody })
  expect(fallback).not.toHaveBeenCalled()
})
it('uses the existing transport when the Resend secret is absent', async () => {
  vi.stubEnv('RESEND_API_KEY', '')
  await sendClubTransactionalEmail(message)
  expect(fallback).toHaveBeenCalledWith({ to: message.to, subject: message.subject, textBody: message.textBody, htmlBody: message.htmlBody })
})
it.each([429, 500])('does not send duplicate mail through another provider after status %s', async status => {
  vi.stubEnv('RESEND_API_KEY', 'test-only-key')
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ message: 'sensitive provider response' }, { status })))
  await expect(sendClubTransactionalEmail(message)).rejects.toThrow(`Resend email request failed (${status}).`)
  expect(fallback).not.toHaveBeenCalled()
})
it('escapes content in the title, preheader and action attributes', () => {
  const html = buildClubEmail({ title: '<img onerror=x>', preview: '<script>x</script>', contentHtml: '<p>Safe content</p>', actionLabel: '<Click>', actionUrl: 'https://legalops.club/?a=1&b="test"' })
  expect(html).not.toContain('<script>')
  expect(html).not.toContain('<img onerror')
  expect(html).toContain('&lt;Click&gt;')
  expect(html).toContain('a=1&amp;b=&quot;test&quot;')
  expect(html).toContain('alt="legalops.club"')
})
