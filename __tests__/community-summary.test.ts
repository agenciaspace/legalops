import { describe, expect, it } from 'vitest'
import { buildDiscussionSummaryFallback, parseDiscussionSummaryResponse } from '@/lib/community-summary'

describe('discussion summary helpers', () => {
  it('parses a fenced structured AI response', () => {
    expect(parseDiscussionSummaryResponse('```json\n{"title":"Semana","summary":"Síntese","key_points":["Um","Dois"]}\n```')).toEqual({
      title: 'Semana',
      summary: 'Síntese',
      keyPoints: ['Um', 'Dois'],
    })
  })

  it('builds a useful fallback when the AI provider is unavailable', () => {
    const result = buildDiscussionSummaryFallback([
      { title: 'Adoção do CLM', body: 'A discussão conectou processo, dados e comportamento.' },
      { title: 'Métricas de IA', body: 'Qualidade e risco devem ser medidos antes da escala.' },
    ])
    expect(result.title).toContain('Adoção do CLM')
    expect(result.keyPoints).toEqual(['Adoção do CLM', 'Métricas de IA'])
    expect(result.summary).toContain('processo')
  })
})
