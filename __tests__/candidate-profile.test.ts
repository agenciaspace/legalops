import { describe, expect, it } from 'vitest'
import {
  isCandidateProfileReady,
  normalizeCandidateProfilePatch,
} from '@/lib/candidate-profile'

describe('candidate profile contract', () => {
  it('normalizes matching and CV fields without accepting arbitrary columns', () => {
    expect(normalizeCandidateProfilePatch({
      full_name: '  Leon Hatori  ',
      desired_roles: [' Legal Ops Manager ', 'Legal Ops Manager', 42],
      areas_of_expertise: ['CLM', ' Automação '],
      skills: ['Gestão de projetos'],
      tools_used: ['Ironclad'],
      preferred_remote: 'remote',
      career_summary: '  Legal Ops com foco em escala. ',
      career_highlights: [' Reduzi o ciclo em 30% ', ''],
      base_cv_text: ' Experiência profissional comprovada. ',
      tier: 'expert',
    })).toEqual({
      full_name: 'Leon Hatori',
      desired_roles: ['Legal Ops Manager'],
      areas_of_expertise: ['CLM', 'Automação'],
      skills: ['Gestão de projetos'],
      tools_used: ['Ironclad'],
      preferred_remote: 'remote',
      career_summary: 'Legal Ops com foco em escala.',
      career_highlights: ['Reduzi o ciclo em 30%'],
      base_cv_text: 'Experiência profissional comprovada.',
    })
  })

  it('requires enough signal to match jobs and create a truthful CV', () => {
    expect(isCandidateProfileReady({
      full_name: 'Leon Hatori',
      current_role: 'Legal Operations Lead',
      desired_roles: ['Head of Legal Operations'],
      areas_of_expertise: ['Legal Operations'],
      career_summary: 'Liderança de operações jurídicas.',
      base_cv_text: 'Experiência em Legal Ops desde 2020.',
    })).toBe(true)

    expect(isCandidateProfileReady({
      full_name: 'Leon Hatori',
      current_role: 'Legal Operations Lead',
      desired_roles: [],
      areas_of_expertise: [],
      career_summary: '',
      base_cv_text: '',
    })).toBe(false)
  })
})
