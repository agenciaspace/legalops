import { describe, it, expect } from 'vitest'
import {
  parseEnrichmentResponse,
  buildEnrichmentPrompt,
  extractKimiResponseText,
} from '@/lib/enrichment'

describe('parseEnrichmentResponse', () => {
  it('parses valid JSON response', () => {
    const json = JSON.stringify({
      salary_min: 15000,
      salary_max: 22000,
      salary_currency: 'BRL',
      benefits: ['plano de saúde', 'vale refeição'],
      remote_label: 'Remote',
      remote_reality: 'fully_remote',
      remote_notes: 'Job is 100% remote with no restrictions',
      posted_at: '2026-03-10',
      suggested_leader_name: 'Ana Lima',
      suggested_leader_title: 'Head of Legal Ops',
      suggested_leader_linkedin: 'https://linkedin.com/in/analima',
    })
    const result = parseEnrichmentResponse(json)
    expect(result).not.toBeNull()
    expect(result!.salary_min).toBe(15000)
    expect(result!.remote_reality).toBe('fully_remote')
    expect(result!.benefits).toHaveLength(2)
  })

  it('returns null for malformed JSON', () => {
    expect(parseEnrichmentResponse('not json at all')).toBeNull()
  })

  it('handles null fields gracefully', () => {
    const json = JSON.stringify({
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
    })
    const result = parseEnrichmentResponse(json)
    expect(result).not.toBeNull()
    expect(result!.remote_reality).toBe('unknown')
  })

  it('rejects invalid remote_reality values', () => {
    const json = JSON.stringify({
      salary_min: null, salary_max: null, salary_currency: null,
      benefits: [], remote_label: null,
      remote_reality: 'purple',
      remote_notes: null, posted_at: null,
      suggested_leader_name: null, suggested_leader_title: null,
      suggested_leader_linkedin: null,
    })
    const result = parseEnrichmentResponse(json)
    expect(result!.remote_reality).toBe('unknown')
  })
})

describe('buildEnrichmentPrompt', () => {
  it('includes job description in prompt', () => {
    const prompt = buildEnrichmentPrompt('Legal Operations Manager at Acme Corp')
    expect(prompt).toContain('Legal Operations Manager at Acme Corp')
    expect(prompt).toContain('remote_reality')
  })
})

describe('extractKimiResponseText', () => {
  it('supports OpenAI-style string content', () => {
    expect(extractKimiResponseText('{"ok":true}')).toBe('{"ok":true}')
  })

  it('supports array-based text content', () => {
    expect(
      extractKimiResponseText([
        { type: 'text', text: '{"foo":' },
        { type: 'text', text: '"bar"}' },
      ])
    ).toBe('{"foo":\n"bar"}')
  })
})
