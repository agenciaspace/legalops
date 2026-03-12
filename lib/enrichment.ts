import Anthropic from '@anthropic-ai/sdk'
import type { RemoteReality } from './types'

const VALID_REMOTE_REALITY: RemoteReality[] = [
  'fully_remote', 'remote_with_travel', 'hybrid_disguised', 'onsite', 'unknown'
]

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

export async function enrichJob(description: string): Promise<EnrichmentResult | null> {
  const client = new Anthropic()

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: 'You are a structured data extractor for job postings. Return only valid JSON, no explanation.',
    messages: [{ role: 'user', content: buildEnrichmentPrompt(description) }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return parseEnrichmentResponse(text)
}
