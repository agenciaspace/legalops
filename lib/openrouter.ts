const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

export const DEFAULT_OPENROUTER_MODEL = 'openrouter/auto'

export type OpenRouterMessageContent =
  | string
  | Array<{ type?: string; text?: string }>
  | null
  | undefined

interface OpenRouterChatResponse {
  choices?: Array<{
    message?: {
      content?: OpenRouterMessageContent
    }
  }>
}

interface GenerateOpenRouterTextParams {
  userPrompt: string
  systemPrompt?: string
  model?: string
  maxTokens?: number
  temperature?: number
}

export function extractOpenRouterResponseText(content: OpenRouterMessageContent): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''

  return content
    .map(part => (part?.type === 'text' && typeof part.text === 'string' ? part.text : ''))
    .filter(Boolean)
    .join('\n')
}

export function getOpenRouterModel(model?: string) {
  return model?.trim() || process.env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL
}

export async function generateOpenRouterText({
  userPrompt,
  systemPrompt,
  model,
  maxTokens = 1024,
  temperature = 0,
}: GenerateOpenRouterTextParams): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured')
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_SITE_URL ?? 'https://legalops.work',
      'X-OpenRouter-Title': process.env.OPENROUTER_APP_NAME ?? 'legalops',
    },
    body: JSON.stringify({
      model: getOpenRouterModel(model),
      temperature,
      max_tokens: maxTokens,
      provider: {
        data_collection: 'deny',
        zdr: true,
      },
      messages: [
        ...(systemPrompt
          ? [
              {
                role: 'system',
                content: systemPrompt,
              },
            ]
          : []),
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new Error(`OpenRouter request failed with ${response.status}: ${errorBody.slice(0, 500)}`)
  }

  const data = (await response.json()) as OpenRouterChatResponse
  const text = extractOpenRouterResponseText(data.choices?.[0]?.message?.content).trim()

  if (!text) {
    throw new Error('OpenRouter response did not include text content')
  }

  return text
}
