// Server-only: never import this module from a client component.
import { createAdminClient } from '@/lib/supabase-admin'

export const MEMBER_OPENAI_MODEL = 'gpt-4.1-mini'
const TABLE = 'club_member_api_keys'
const encoder = new TextEncoder()

export class MemberKeyError extends Error {
  constructor(public readonly code: string, public readonly status = 503) {
    super(code)
    this.name = 'MemberKeyError'
  }
}

function encryptionMaterial() {
  const value = process.env.CLUB_API_KEY_ENCRYPTION_KEY ?? ''
  if (!/^[a-f0-9]{64}$/i.test(value)) throw new MemberKeyError('key_storage_unavailable')
  return Uint8Array.from(value.match(/../g)!, byte => parseInt(byte, 16))
}

export function memberKeyStorageReady() {
  return /^[a-f0-9]{64}$/i.test(process.env.CLUB_API_KEY_ENCRYPTION_KEY ?? '')
}

async function encryptionKey() {
  return crypto.subtle.importKey('raw', encryptionMaterial(), 'AES-GCM', false, ['encrypt', 'decrypt'])
}

export async function encryptMemberKey(userId: string, plaintext: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv,
    additionalData: encoder.encode(`club-api-key:v1:openai:${userId}`),
  }, await encryptionKey(), encoder.encode(plaintext))
  return `v1.${Buffer.from(iv).toString('base64')}.${Buffer.from(ciphertext).toString('base64')}`
}

export async function decryptMemberKey(userId: string, envelope: string) {
  try {
    const [version, iv, ciphertext, extra] = envelope.split('.')
    if (version !== 'v1' || !iv || !ciphertext || extra) throw new Error('Invalid envelope')
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM',
      iv: Buffer.from(iv, 'base64'), additionalData: encoder.encode(`club-api-key:v1:openai:${userId}`),
    }, await encryptionKey(), Buffer.from(ciphertext, 'base64'))
    return new TextDecoder().decode(plaintext)
  } catch {
    // Never include crypto, database or provider payloads in errors or logs.
    throw new MemberKeyError('key_storage_unavailable')
  }
}

export function validMemberKey(value: unknown): value is string {
  return typeof value === 'string' && /^sk-[A-Za-z0-9_-]{20,500}$/.test(value)
}

async function openAIRequest(apiKey: string, path: string, body?: object) {
  let response: Response
  try {
    response = await fetch(`https://api.openai.com/v1/${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
      // Workers do not support redirect:'error'. Manual mode keeps credentials
      // on this fixed origin; every 3xx is rejected by the !response.ok check.
      cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(body ? 24000 : 10000),
    })
  } catch {
    throw new MemberKeyError('provider_unavailable')
  }
  if (!response.ok) {
    await response.body?.cancel()
    if (response.status === 401) throw new MemberKeyError('invalid_api_key', 422)
    if (response.status === 403 || response.status === 404) throw new MemberKeyError('model_access_denied', 422)
    if (response.status === 429) throw new MemberKeyError('provider_limit', 429)
    throw new MemberKeyError('provider_unavailable')
  }
  return response
}

export async function validateMemberKey(apiKey: string) {
  // Model lookup validates the credential without generating billable text.
  const response = await openAIRequest(apiKey, `models/${MEMBER_OPENAI_MODEL}`)
  await response.body?.cancel()
}

export async function memberKeyStatus(userId: string) {
  const { data, error } = await createAdminClient().from(TABLE)
    .select('key_last_four,updated_at').eq('user_id', userId).maybeSingle()
  if (error) throw new MemberKeyError('key_storage_unavailable')
  return data ? { provider: 'openai' as const, model: MEMBER_OPENAI_MODEL,
    last_four: data.key_last_four as string, updated_at: data.updated_at as string } : null
}

export async function saveMemberKey(userId: string, apiKey: string) {
  const encryptedKey = await encryptMemberKey(userId, apiKey)
  await validateMemberKey(apiKey)
  const { error } = await createAdminClient().from(TABLE).upsert({ user_id: userId,
    encrypted_key: encryptedKey, key_last_four: apiKey.slice(-4), updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (error) throw new MemberKeyError('key_storage_unavailable')
  return { provider: 'openai' as const, model: MEMBER_OPENAI_MODEL, last_four: apiKey.slice(-4) }
}

export async function removeMemberKey(userId: string) {
  const { error } = await createAdminClient().from(TABLE).delete().eq('user_id', userId)
  if (error) throw new MemberKeyError('key_storage_unavailable')
}

export async function loadMemberKey(userId: string): Promise<string | null> {
  const { data, error } = await createAdminClient().from(TABLE)
    .select('encrypted_key').eq('user_id', userId).maybeSingle()
  // Fail closed: a storage outage must not switch who pays for the request.
  if (error) throw new MemberKeyError('key_storage_unavailable')
  return data ? decryptMemberKey(userId, data.encrypted_key) : null
}

export async function generateMemberOpenAIText(apiKey: string, prompt: { systemPrompt: string; userPrompt: string; maxTokens?: number }) {
  const response = await openAIRequest(apiKey, 'responses', {
    model: MEMBER_OPENAI_MODEL, instructions: prompt.systemPrompt,
    input: [{ role: 'user', content: prompt.userPrompt }],
    store: false, max_output_tokens: Math.min(prompt.maxTokens ?? 1400, 4000),
  })
  // Bound response parsing even if the upstream response violates its token cap.
  const reader = response.body?.getReader()
  if (!reader) throw new MemberKeyError('provider_unavailable')
  let size = 0
  const chunks: Uint8Array[] = []
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 256 * 1024) { await reader.cancel(); throw new MemberKeyError('provider_unavailable') }
      chunks.push(value)
    }
    const data = JSON.parse(Buffer.concat(chunks).toString('utf8')) as {
      status?: string; output?: { type: string; content?: { type: string; text?: string }[] }[]
    }
    if (data.status !== 'completed') throw new MemberKeyError('provider_unavailable')
    const text = (data.output ?? []).filter(item => item.type === 'message')
      .flatMap(item => item.content ?? []).filter(item => item.type === 'output_text')
      .map(item => item.text ?? '').join('\n').trim()
    if (!text) throw new MemberKeyError('provider_unavailable')
    return text
  } catch {
    throw new MemberKeyError('provider_unavailable')
  } finally { reader.releaseLock() }
}
