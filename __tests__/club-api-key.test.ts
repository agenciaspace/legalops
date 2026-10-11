// @vitest-environment node
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
const state = vi.hoisted(() => ({ data: null as unknown, error: null as unknown, calls: [] as unknown[][] }))
vi.mock('@/lib/supabase-admin', () => ({ createAdminClient: () => ({ from: (table: string) => {
  const query: any = {}
  for (const method of ['select', 'upsert', 'delete', 'eq']) query[method] = (...args: unknown[]) => { state.calls.push([table, method, ...args]); return query }
  query.maybeSingle = async () => ({ data: state.data, error: state.error })
  query.then = (resolve: (value: unknown) => unknown) => resolve({ data: state.data, error: state.error })
  return query
} }) }))
import { encryptMemberKey, decryptMemberKey, saveMemberKey, memberKeyStatus, loadMemberKey, removeMemberKey, generateMemberOpenAIText } from '@/lib/club-api-key'
const key = 'sk-proj-test-key-for-unit-testing-only'
const fetchMock = vi.fn()
beforeEach(() => { state.data = null; state.error = null; state.calls = []; vi.stubEnv('CLUB_API_KEY_ENCRYPTION_KEY', 'ab'.repeat(32)); vi.stubGlobal('fetch', fetchMock); fetchMock.mockReset() })
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

it('encrypts with random IVs and binds ciphertext to the owning member', async () => {
  const envelope = await encryptMemberKey('owner', key)
  expect(envelope).not.toContain(key)
  expect(await encryptMemberKey('owner', key)).not.toBe(envelope)
  expect(await decryptMemberKey('owner', envelope)).toBe(key)
  await expect(decryptMemberKey('intruder', envelope)).rejects.toMatchObject({ code: 'key_storage_unavailable' })
  await expect(decryptMemberKey('owner', envelope.replace('v1.', 'v2.'))).rejects.toThrow()
})
it('validates without text generation and stores only encrypted credentials', async () => {
  fetchMock.mockResolvedValue(new Response('{}'))
  const status = await saveMemberKey('owner', key)
  expect(fetchMock).toHaveBeenCalledWith('https://api.openai.com/v1/models/gpt-4.1-mini', expect.objectContaining({ method: 'GET', redirect: 'manual' }))
  const saved = state.calls.find(call => call[1] === 'upsert')![2] as any
  expect(saved.user_id).toBe('owner'); expect(saved.encrypted_key).not.toContain(key)
  expect(await decryptMemberKey('owner', saved.encrypted_key)).toBe(key)
  expect(JSON.stringify(status)).not.toContain(key)
})
it('does not overwrite an existing connection if validation fails and never exposes upstream body', async () => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: { message: key } }), { status: 401 }))
  await expect(saveMemberKey('owner', key)).rejects.toMatchObject({ code: 'invalid_api_key', message: 'invalid_api_key' })
  expect(state.calls).toEqual([])
})
it('returns metadata only, scopes reads and deletes by the owner, and fails closed on storage errors', async () => {
  state.data = { key_last_four: 'only', updated_at: 'today' }
  expect(await memberKeyStatus('owner')).toEqual({ provider: 'openai', model: 'gpt-4.1-mini', last_four: 'only', updated_at: 'today' })
  expect(state.calls).toContainEqual(['club_member_api_keys', 'select', 'key_last_four,updated_at'])
  await removeMemberKey('owner')
  expect(state.calls).toContainEqual(['club_member_api_keys', 'eq', 'user_id', 'owner'])
  state.error = { message: key }
  await expect(loadMemberKey('owner')).rejects.toMatchObject({ code: 'key_storage_unavailable' })
})
it('fails safely when encryption material is absent or changed', async () => {
  const envelope = await encryptMemberKey('owner', key)
  vi.stubEnv('CLUB_API_KEY_ENCRYPTION_KEY', '')
  await expect(encryptMemberKey('owner', key)).rejects.toMatchObject({ code: 'key_storage_unavailable' })
  vi.stubEnv('CLUB_API_KEY_ENCRYPTION_KEY', 'cd'.repeat(32))
  await expect(decryptMemberKey('owner', envelope)).rejects.toMatchObject({ code: 'key_storage_unavailable' })
})
it('uses the supplied key for a bounded Responses request without storing upstream conversations', async () => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: 'Resposta.' }] }] })))
  expect(await generateMemberOpenAIText(key, { systemPrompt: 'Rules', userPrompt: 'Question' })).toBe('Resposta.')
  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toBe('https://api.openai.com/v1/responses')
  expect(init.headers.Authorization).toBe(`Bearer ${key}`)
  expect(JSON.parse(init.body)).toMatchObject({ store: false, max_output_tokens: 1400, instructions: 'Rules' })
  expect(init.body).not.toContain(key)
})
it('reports limits without retrying, logging keys, or returning provider text', async () => {
  fetchMock.mockResolvedValue(new Response(key, { status: 429 }))
  await expect(generateMemberOpenAIText(key, { systemPrompt: '', userPrompt: 'Question' })).rejects.toMatchObject({ code: 'provider_limit', message: 'provider_limit' })
  expect(fetchMock).toHaveBeenCalledTimes(1)
})
it('rejects redirects without forwarding the member credential to another origin', async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 302, headers: { location: 'https://untrusted.example/' } }))
  await expect(saveMemberKey('owner', key)).rejects.toMatchObject({ code: 'provider_unavailable' })
  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(fetchMock.mock.calls[0][1].redirect).toBe('manual')
  expect(state.calls).toEqual([])
})
it('rejects incomplete provider answers and oversized bodies', async () => {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ status: 'incomplete', output: [] })))
    .mockResolvedValueOnce(new Response('x'.repeat(270000)))
  await expect(generateMemberOpenAIText(key, { systemPrompt: '', userPrompt: 'Q' })).rejects.toThrow('provider_unavailable')
  await expect(generateMemberOpenAIText(key, { systemPrompt: '', userPrompt: 'Q' })).rejects.toThrow('provider_unavailable')
})
