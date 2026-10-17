import { beforeEach, expect, it, vi } from 'vitest'
vi.mock('@/lib/openrouter', () => ({ generateOpenRouterText: vi.fn() }))
import { generateOpenRouterText } from '@/lib/openrouter'
import { generateWhatsAppText, isLocalGeneration, LocalGenerationRequired } from '@/lib/whatsapp-generation'

beforeEach(() => vi.clearAllMocks())

it('offers the local runner the same prompt only on a provider credit failure', async () => {
  vi.mocked(generateOpenRouterText).mockRejectedValue(Object.assign(new Error('private provider body'), { status: 402 }))
  const error = await generateWhatsAppText({ userPrompt: 'source context', systemPrompt: 'privacy rules' }).catch(error => error)
  expect(error).toBeInstanceOf(LocalGenerationRequired)
  expect(error.request).toEqual({ system: 'privacy rules', prompt: 'source context' })
  expect(error.message).not.toContain('private provider body')
})

it('does not disguise other provider failures as credit problems', async () => {
  const error = Object.assign(new Error('unauthorized'), { status: 401 })
  vi.mocked(generateOpenRouterText).mockRejectedValue(error)
  await expect(generateWhatsAppText({ userPrompt: 'context' })).rejects.toBe(error)
})

it('returns local text for the existing digest validator without repeating the paid call', async () => {
  await expect(generateWhatsAppText({ userPrompt: 'context' }, { model: 'claude-cli/sonnet', text: '{"publish":false}' })).resolves.toBe('{"publish":false}')
  expect(generateOpenRouterText).not.toHaveBeenCalled()
})

it('bounds the local response and rejects arbitrary generators', () => {
  expect(isLocalGeneration({ model: 'claude-cli/sonnet', text: '{"publish":false}' })).toBe(true)
  for (const input of [null, {}, { model: 'unknown', text: '{}' }, { model: 'claude-cli/sonnet', text: '' }, { model: 'claude-cli/sonnet', text: 'a'.repeat(12001) }]) expect(isLocalGeneration(input)).toBe(false)
})
