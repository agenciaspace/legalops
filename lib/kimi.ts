const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions'
const DEFAULT_KIMI_MODEL = 'moonshot-v1-8k'

export type KimiMessageContent =
  | string
  | Array<{ type?: string; text?: string }>
  | null
  | undefined

interface KimiChatResponse {
  choices?: Array<{
    message?: {
      content?: KimiMessageContent
    }
  }>
}

interface GenerateKimiTextParams {
  userPrompt: string
  systemPrompt?: string
  model?: string
  maxTokens?: number
  temperature?: number
}

export function extractKimiResponseText(content: KimiMessageContent): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''

  return content
    .map(part => (part?.type === 'text' && typeof part.text === 'string' ? part.text : ''))
    .join('\n')
}

export async function generateKimiText({
  userPrompt,
  systemPrompt,
  model,
  maxTokens = 1024,
  temperature = 0,
}: GenerateKimiTextParams): Promise<string> {
  const apiKey = process.env.KIMI_API_KEY
  if (!apiKey) {
    throw new Error('KIMI_API_KEY is not configured')
  }

  const response = await fetch(KIMI_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model ?? process.env.KIMI_MODEL ?? DEFAULT_KIMI_MODEL,
      temperature,
      max_tokens: maxTokens,
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
    throw new Error(`Kimi request failed with ${response.status}: ${errorBody.slice(0, 500)}`)
  }

  const data = (await response.json()) as KimiChatResponse
  const text = extractKimiResponseText(data.choices?.[0]?.message?.content).trim()

  if (!text) {
    throw new Error('Kimi response did not include text content')
  }

  return text
}
