import { beforeEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), welcome: vi.fn(), avatarPath:'11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.jpg' as string|null }))
vi.mock('@/lib/supabase-server', () => ({ createServerSupabaseClient: async () => { const query={select:()=>query,eq:()=>query,maybeSingle:async()=>({data:{avatar_path:mocks.avatarPath}})};return { auth: { getUser: async () => ({ data: { user: { id: '11111111-1111-4111-8111-111111111111', email: 'member@example.com', email_confirmed_at: '2026-09-16' } } }) }, from:()=>query, rpc: mocks.rpc } } }))
vi.mock('@/lib/welcome-email', () => ({ sendClubWelcomeEmailIfNeeded: mocks.welcome }))
import { joinClub } from '@/app/club/entrar/actions'
const profile = { full_name: 'Ana Souza', current_role: 'Legal Ops', organization_name: 'Empresa', city: 'São Paulo', public_bio: 'Trabalho com operações jurídicas e contratos.', linkedin_url: 'https://www.linkedin.com/in/ana', sector: 'legal_ops', interests: ['Contratos / CLM'], accepted_rules: true }
beforeEach(() => { vi.clearAllMocks();mocks.avatarPath='11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.jpg'; mocks.rpc.mockResolvedValue({ error: null }); mocks.welcome.mockResolvedValue(true) })
it('sends community welcome after admission succeeds', async () => {
  await expect(joinClub(profile)).resolves.toEqual({ ok: true })
  expect(mocks.welcome).toHaveBeenCalledWith(expect.objectContaining({ id: '11111111-1111-4111-8111-111111111111' }))
  expect(mocks.rpc.mock.invocationCallOrder[0]).toBeLessThan(mocks.welcome.mock.invocationCallOrder[0])
})
it('does not send welcome when admission fails', async () => {
  mocks.rpc.mockResolvedValue({ error: { message: 'rejected' } })
  expect((await joinClub(profile)).ok).toBe(false)
  expect(mocks.welcome).not.toHaveBeenCalled()
})
it('requires a saved photo before calling the admission RPC', async () => {
  mocks.avatarPath=null
  await expect(joinClub(profile)).resolves.toEqual({ok:false,error:'Adicione sua foto para concluir o cadastro.'})
  expect(mocks.rpc).not.toHaveBeenCalled()
})
it('keeps membership usable when email delivery fails', async () => {
  mocks.welcome.mockRejectedValue(new Error('provider unavailable'))
  const log = vi.spyOn(console, 'error').mockImplementation(() => {})
  await expect(joinClub(profile)).resolves.toEqual({ ok: true })
  log.mockRestore()
})
