import type { RemoteReality } from './types'

const VALID_REMOTE_REALITY: RemoteReality[] = [
  'fully_remote', 'remote_with_travel', 'hybrid_disguised', 'onsite', 'unknown'
]

const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions'
const DEFAULT_KIMI_MODEL = 'moonshot-v1-8k'

export interface EnrichmentResult {
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  benefits: string[]
  remote_label: string | null
  remote_reality: RemoteReality
  remote_notes: string | null
  posted_at: string | null
  suggested_leader_name: string | null
  suggested_leader_title: string | null
  suggested_leader_linkedin: string | null
}

export function buildEnrichmentPrompt(description: string): string {
  return `Extract the following from this job posting and return as JSON only, no explanation:
{
  "salary_min": integer or null,
  "salary_max": integer or null,
  "salary_currency": "BRL" | "USD" | "EUR" | "GBP" | "other" | null,
  "benefits": string array,
  "remote_label": string or null,
  "remote_reality": "fully_remote" | "remote_with_travel" | "hybrid_disguised" | "onsite" | "unknown",
  "remote_notes": one sentence explanation or null,
  "posted_at": ISO 8601 date string or null,
  "suggested_leader_name": string or null,
  "suggested_leader_title": string or null,
  "suggested_leader_linkedin": full LinkedIn URL (https://linkedin.com/in/...) or null
}

Rules:
- salary: monthly for BRL, annual for USD/EUR/GBP
- remote_reality: "hybrid_disguised" if posting says remote but requires office presence
- suggested_leader: the likely direct manager based on job content

Job posting:
${description}`
}

export function parseEnrichmentResponse(text: string): EnrichmentResult | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    const data = JSON.parse(jsonMatch[0])

    const remoteReality: RemoteReality = VALID_REMOTE_REALITY.includes(data.remote_reality)
      ? data.remote_reality
      : 'unknown'

    return {
      salary_min: typeof data.salary_min === 'number' ? data.salary_min : null,
      salary_max: typeof data.salary_max === 'number' ? data.salary_max : null,
      salary_currency: typeof data.salary_currency === 'string' ? data.salary_currency : null,
      benefits: Array.isArray(data.benefits) ? data.benefits.filter((b: unknown) => typeof b === 'string') : [],
      remote_label: typeof data.remote_label === 'string' ? data.remote_label : null,
      remote_reality: remoteReality,
      remote_notes: typeof data.remote_notes === 'string' ? data.remote_notes : null,
      posted_at: typeof data.posted_at === 'string' ? data.posted_at : null,
      suggested_leader_name: typeof data.suggested_leader_name === 'string' ? data.suggested_leader_name : null,
      suggested_leader_title: typeof data.suggested_leader_title === 'string' ? data.suggested_leader_title : null,
      suggested_leader_linkedin: typeof data.suggested_leader_linkedin === 'string' ? data.suggested_leader_linkedin : null,
    }
  } catch {
    return null
  }
}

type KimiMessageContent =
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

export function extractKimiResponseText(content: KimiMessageContent): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''

  return content
    .map(part => (part?.type === 'text' && typeof part.text === 'string' ? part.text : ''))
    .join('\n')
}

export async function enrichJob(description: string): Promise<EnrichmentResult | null> {
  const apiKey = process.env.KIMI_API_KEY
  if (!apiKey) {
    console.error('[enrichment] KIMI_API_KEY is not configured')
    return null
  }

  try {
    const response = await fetch(KIMI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.KIMI_MODEL ?? DEFAULT_KIMI_MODEL,
        temperature: 0,
        max_tokens: 1024,
        messages: [
          {
            role: 'system',
            content: 'You are a structured data extractor for job postings. Return only valid JSON, no explanation.',
          },
          {
            role: 'user',
            content: buildEnrichmentPrompt(description),
          },
        ],
      }),
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      console.error(
        `[enrichment] Kimi request failed with ${response.status}: ${errorBody.slice(0, 500)}`
      )
      return null
    }

    const data = (await response.json()) as KimiChatResponse
    const text = extractKimiResponseText(data.choices?.[0]?.message?.content)
    return parseEnrichmentResponse(text)
  } catch (error) {
    console.error('[enrichment] Kimi request failed:', error)
    return null
  }
}
