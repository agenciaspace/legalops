import { afterEach, expect, it, vi } from 'vitest'
import { sendCloudflareTransactionalEmail } from '@/lib/cloudflare-email'
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })
it('does not treat a permanent bounce as a sent welcome', async () => {
  vi.stubEnv('CLOUDFLARE_ACCOUNT_ID', 'account')
  vi.stubEnv('CLOUDFLARE_EMAIL_API_TOKEN', 'test-only')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, result: { permanent_bounces: ['ana@example.com'] } }) }))
  await expect(sendCloudflareTransactionalEmail({ to: ['ana@example.com'], subject: 'Welcome', textBody: 'Welcome' })).rejects.toThrow('delivery was not completed')
})
