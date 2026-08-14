import { describe, expect, it } from 'vitest'
import {
  buildClubJobMatch,
  type ClubJobProfile,
  type MatchableJob,
} from '@/lib/club-job-matching'

const profile: ClubJobProfile = {
  user_id: 'member-1',
  current_role: 'Legal Operations Analyst',
  desired_roles: ['CLM Manager'],
  areas_of_expertise: ['Contratos', 'CLM'],
  skills: ['Gestão de projetos'],
  tools_used: ['Ironclad'],
  preferred_remote: 'remote',
  open_to_opportunities: true,
  job_alerts_enabled: true,
  cv_suggestions_enabled: true,
}

const job: MatchableJob = {
  id: 'job-1',
  title: 'CLM Manager',
  company: 'Acme',
  raw_description: 'Lead contract operations, project management and the Ironclad rollout.',
  remote_reality: 'fully_remote',
  source_board: 'greenhouse',
}

describe('buildClubJobMatch', () => {
  it('scores role, expertise, tool and work-model matches', () => {
    const match = buildClubJobMatch(profile, job)

    expect(match.score).toBeGreaterThanOrEqual(80)
    expect(match.reasons.join(' ')).toContain('CLM Manager')
    expect(match.reasons.join(' ')).toContain('Ironclad')
    expect(match.cvSuggestions.length).toBeGreaterThan(0)
  })

  it('returns a useful baseline alert for a new Legal Ops job', () => {
    const match = buildClubJobMatch(
      { ...profile, desired_roles: [], current_role: null, areas_of_expertise: [], skills: [], tools_used: [], preferred_remote: null },
      { ...job, title: 'Legal Operations Coordinator', raw_description: '', remote_reality: 'unknown' },
    )

    expect(match.score).toBe(35)
    expect(match.reasons).toEqual(['O crawler encontrou uma nova vaga na área de Legal Ops.'])
    expect(match.cvSuggestions[0]).toContain('Legal Operations Coordinator')
  })

  it('does not create CV suggestions when the member disables them', () => {
    const match = buildClubJobMatch({ ...profile, cv_suggestions_enabled: false }, job)
    expect(match.cvSuggestions).toEqual([])
  })
})
