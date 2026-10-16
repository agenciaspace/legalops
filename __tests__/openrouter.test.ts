import { afterEach, describe, expect, it, vi } from 'vitest'
import { chatResponseFormat, makeSources } from '@/lib/chat/model'
import {
  extractOpenRouterResponseText,
  generateOpenRouterText,
  getOpenRouterModel,
} from '@/lib/openrouter'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('OpenRouter response helpers', () => {
  it('requires providers to constrain Chat citations to the supplied document passages', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key')
    const fetchMock = vi.fn().mockResolvedValue(Response.json({choices:[{message:{content:'Result'}}]}))
    vi.stubGlobal('fetch', fetchMock)
    const {sources} = makeSources([{id:'doc-1',name:'Model',kind:'model',content:'A renovação dependerá de acordo escrito.'}], 'renovação')
    await generateOpenRouterText({userPrompt:'Question', responseFormat:chatResponseFormat(sources)})
    const request = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(request.provider).toEqual({data_collection:'deny',zdr:true,require_parameters:true})
    expect(request.response_format.json_schema.strict).toBe(true)
    const citation = request.response_format.json_schema.schema.properties.findings.items.properties.citations.items
    expect(citation.additionalProperties).toBe(false)
    expect(citation.required).toEqual(['source_id'])
    expect(citation.properties.source_id.enum).toEqual(['S1'])
    expect(citation.properties).not.toHaveProperty('quote')
  })
  it('reports provider cost and tokens without sending the accounting callback to the provider', async () => {
    vi.stubEnv('OPENROUTER_API_KEY','test-key')
    const usage=vi.fn(async()=>{})
    const fetchMock=vi.fn().mockResolvedValue(Response.json({model:'provider/model',usage:{cost:0.002,prompt_tokens:1200,completion_tokens:400},choices:[{message:{content:'Result'}}]}))
    vi.stubGlobal('fetch',fetchMock)
    expect(await generateOpenRouterText({userPrompt:'Question',onUsage:usage})).toBe('Result')
    expect(usage).toHaveBeenCalledWith({model:'provider/model',cost:0.002,inputTokens:1200,outputTokens:400})
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).not.toHaveProperty('onUsage')
  })
  it('keeps missing provider costs unknown instead of reporting zero',async()=>{
    vi.stubEnv('OPENROUTER_API_KEY','test-key')
    const usage=vi.fn(async()=>{})
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({usage:{cost:-1,prompt_tokens:1.5},choices:[{message:{content:'Result'}}]})))
    await generateOpenRouterText({userPrompt:'Question',onUsage:usage})
    expect(usage).toHaveBeenCalledWith({model:null,cost:null,inputTokens:null,outputTokens:null})
  })
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

    const timeout = vi.spyOn(AbortSignal, 'timeout')
    await expect(generateOpenRouterText({ userPrompt: 'Pergunta', timeoutMs: 35000 })).resolves.toBe('Resposta')
    expect(timeout).toHaveBeenCalledWith(35000)
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
