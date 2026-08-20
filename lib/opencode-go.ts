const OPENCODE_GO_API_URL = 'https://opencode.ai/zen/go/v1/chat/completions'
const DEFAULT_OPENCODE_GO_MODEL = 'deepseek-v4-flash'

type MessageContent = string | Array<{ type?: string; text?: string }> | null | undefined

type OpenCodeGoResponse = {
  choices?: Array<{ message?: { content?: MessageContent } }>
}

export function extractOpenCodeGoResponseText(content: MessageContent) {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content
    .map(part => part?.type === 'text' && typeof part.text === 'string' ? part.text : '')
    .filter(Boolean)
    .join('\n')
}

export async function generateOpenCodeGoText({
  systemPrompt,
  userPrompt,
  maxTokens = 1024,
  temperature = 0,
}: {
  systemPrompt?: string
  userPrompt: string
  maxTokens?: number
  temperature?: number
}) {
  const apiKey = process.env.OPENCODE_GO_API_KEY ?? process.env.OPENCODE_API_KEY
  if (!apiKey) throw new Error('OPENCODE_GO_API_KEY is not configured')

  const response = await fetch(process.env.OPENCODE_GO_API_URL ?? OPENCODE_GO_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENCODE_GO_MODEL ?? DEFAULT_OPENCODE_GO_MODEL,
      temperature,
      max_tokens: maxTokens,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: userPrompt },
      ],
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new Error(`OpenCode Go request failed with ${response.status}: ${errorBody.slice(0, 500)}`)
  }

  const data = await response.json() as OpenCodeGoResponse
  const text = extractOpenCodeGoResponseText(data.choices?.[0]?.message?.content).trim()
  if (!text) throw new Error('OpenCode Go response did not include text content')
  return text
}
