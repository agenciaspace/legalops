import { describe, expect, it } from 'vitest'
import {
  buildFallbackPersonalizedCv,
  buildPersonalizedCvPrompt,
  classifyJobTrack,
  parsePersonalizedCvResponse,
} from '@/lib/personalized-cv'

const profile = {
  full_name: 'Leon Hatori',
  current_role: 'Legal Operations Lead',
  years_experience: 8,
  areas_of_expertise: ['CLM', 'Automação'],
  skills: ['Gestão de projetos', 'SQL'],
  tools_used: ['Ironclad'],
  career_summary: 'Lidera operações jurídicas orientadas por dados.',
  career_highlights: ['Reduziu o ciclo contratual em 30%.'],
  base_cv_text: 'Legal Operations Lead na Acme desde 2022. Liderou implantação de CLM.',
}

describe('personalized CV', () => {
  it('distinguishes technical and strategic jobs', () => {
    expect(classifyJobTrack('Legal Ops Automation Engineer', 'SQL, APIs and workflow automation')).toBe('technical')
    expect(classifyJobTrack('Head of Legal Operations', 'Strategy, leadership, budget and executive stakeholders')).toBe('strategic')
    expect(classifyJobTrack('Legal Operations Manager', 'Lead the CLM implementation and team roadmap')).toBe('hybrid')
  })

  it('instructs the model to tailor emphasis without inventing experience', () => {
    const prompt = buildPersonalizedCvPrompt(profile, {
      title: 'Legal Ops Automation Engineer',
      company: 'Example',
      raw_description: 'Build integrations using SQL and APIs.',
    }, 'technical')

    expect(prompt).toContain('Nunca invente')
    expect(prompt).toContain('SQL')
    expect(prompt).toContain('technical')
    expect(prompt).toContain('Reduziu o ciclo contratual em 30%')
  })

  it('parses structured model output and keeps a deterministic truthful fallback', () => {
    expect(parsePersonalizedCvResponse('```json\n{"headline":"Legal Ops | CLM","summary":"Resumo","skills":["CLM"],"highlights":["Reduziu o ciclo em 30%."],"keywords":["SQL"],"markdown":"# CV"}\n```')).toEqual({
      headline: 'Legal Ops | CLM',
      summary: 'Resumo',
      skills: ['CLM'],
      highlights: ['Reduziu o ciclo em 30%.'],
      keywords: ['SQL'],
      markdown: '# CV',
    })

    const fallback = buildFallbackPersonalizedCv(profile, {
      title: 'Head of Legal Operations',
      company: 'Example',
      raw_description: 'Strategy and leadership.',
    }, 'strategic')
    expect(fallback.markdown).toContain('Leon Hatori')
    expect(fallback.markdown).toContain('Reduziu o ciclo contratual em 30%')
    expect(fallback.markdown).not.toContain('invent')
  })
})
