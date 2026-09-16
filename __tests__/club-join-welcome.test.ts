import { beforeEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), welcome: vi.fn() }))
vi.mock('@/lib/supabase-server', () => ({ createServerSupabaseClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'member', email: 'member@example.com', email_confirmed_at: '2026-09-16' } } }) }, rpc: mocks.rpc }) }))
vi.mock('@/lib/welcome-email', () => ({ sendClubWelcomeEmailIfNeeded: mocks.welcome }))
import { joinClub } from '@/app/club/entrar/actions'
const profile = { full_name: 'Ana Souza', current_role: 'Legal Ops', organization_name: 'Empresa', city: 'São Paulo', public_bio: 'Trabalho com operações jurídicas e contratos.', linkedin_url: 'https://www.linkedin.com/in/ana', sector: 'legal_ops', interests: ['Contratos / CLM'], accepted_rules: true }
beforeEach(() => { vi.clearAllMocks(); mocks.rpc.mockResolvedValue({ error: null }); mocks.welcome.mockResolvedValue(true) })
it('sends community welcome after admission succeeds', async () => {
  await expect(joinClub(profile)).resolves.toEqual({ ok: true })
  expect(mocks.welcome).toHaveBeenCalledWith(expect.objectContaining({ id: 'member' }))
  expect(mocks.rpc.mock.invocationCallOrder[0]).toBeLessThan(mocks.welcome.mock.invocationCallOrder[0])
})
it('does not send welcome when admission fails', async () => {
  mocks.rpc.mockResolvedValue({ error: { message: 'rejected' } })
  expect((await joinClub(profile)).ok).toBe(false)
  expect(mocks.welcome).not.toHaveBeenCalled()
})
it('keeps membership usable when email delivery fails', async () => {
  mocks.welcome.mockRejectedValue(new Error('provider unavailable'))
  const log = vi.spyOn(console, 'error').mockImplementation(() => {})
  await expect(joinClub(profile)).resolves.toEqual({ ok: true })
  log.mockRestore()
})
