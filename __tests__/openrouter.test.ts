import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  extractOpenRouterResponseText,
  generateOpenRouterText,
  getOpenRouterModel,
} from '@/lib/openrouter'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('OpenRouter response helpers', () => {
  it('extracts text from string and multipart content', () => {
    expect(extractOpenRouterResponseText('Resumo')).toBe('Resumo')
    expect(extractOpenRouterResponseText([
      { type: 'text', text: 'Parte 1' },
      { type: 'reasoning', text: 'ignorar' },
      { type: 'text', text: 'Parte 2' },
    ])).toBe('Parte 1\nParte 2')
  })

  it('uses the stable auto router when no model is configured', () => {
    vi.stubEnv('OPENROUTER_MODEL', '')
    expect(getOpenRouterModel()).toBe('openrouter/auto')
    expect(getOpenRouterModel(' google/gemini-2.5-flash ')).toBe('google/gemini-2.5-flash')
  })

  it('sends attribution and privacy routing controls', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key')
    vi.stubEnv('OPENROUTER_MODEL', 'openrouter/auto')
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Resposta' } }] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(generateOpenRouterText({ userPrompt: 'Pergunta' })).resolves.toBe('Resposta')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
          'HTTP-Referer': 'https://legalops.work',
          'X-OpenRouter-Title': 'legalops',
        }),
        body: expect.stringContaining('"data_collection":"deny"'),
      }),
    )
    const request = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(request.provider).toEqual({ data_collection: 'deny', zdr: true })
  })
})
