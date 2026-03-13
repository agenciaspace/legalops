import { extractKimiResponseText, generateKimiText } from './kimi'
import { researchSuggestedLeader } from './leader-research'
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

interface EnrichJobParams {
  company: string
  description: string
  jobTitle?: string | null
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
- suggested_leader_*: only fill these fields if the posting explicitly names the reporting line or manager. If the manager is not explicitly named in the posting, return null because public web research happens separately.

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

export { extractKimiResponseText }

function emptyEnrichmentResult(): EnrichmentResult {
  return {
    salary_min: null,
    salary_max: null,
    salary_currency: null,
    benefits: [],
    remote_label: null,
    remote_reality: 'unknown',
    remote_notes: null,
    posted_at: null,
    suggested_leader_name: null,
    suggested_leader_title: null,
    suggested_leader_linkedin: null,
  }
}

function mergeSuggestedLeader(
  enrichment: EnrichmentResult,
  leaderSuggestion: {
    suggested_leader_name: string | null
    suggested_leader_title: string | null
    suggested_leader_linkedin: string | null
  } | null
): EnrichmentResult {
  if (!leaderSuggestion?.suggested_leader_name) return enrichment

  return {
    ...enrichment,
    suggested_leader_name: leaderSuggestion.suggested_leader_name,
    suggested_leader_title: leaderSuggestion.suggested_leader_title,
    suggested_leader_linkedin: leaderSuggestion.suggested_leader_linkedin,
  }
}

export async function enrichJob({
  company,
  description,
  jobTitle,
}: EnrichJobParams): Promise<EnrichmentResult | null> {
  const apiKey = process.env.KIMI_API_KEY
  let enrichment = apiKey ? null : emptyEnrichmentResult()

  if (!apiKey) {
    console.error('[enrichment] KIMI_API_KEY is not configured, skipping description extraction')
  }

  if (apiKey) {
    try {
      const text = await generateKimiText({
        systemPrompt: 'You are a structured data extractor for job postings. Return only valid JSON, no explanation.',
        userPrompt: buildEnrichmentPrompt(description),
        maxTokens: 1024,
        temperature: 0,
      })
      enrichment = parseEnrichmentResponse(text)
    } catch (error) {
      console.error('[enrichment] Kimi request failed:', error)
    }
  }

  let publicLeaderSuggestion = null

  try {
    publicLeaderSuggestion = await researchSuggestedLeader({ company, jobTitle })
  } catch (error) {
    console.error('[leader-research] public search failed:', error)
  }

  if (!enrichment && !publicLeaderSuggestion) return null
  return mergeSuggestedLeader(enrichment ?? emptyEnrichmentResult(), publicLeaderSuggestion)
}
