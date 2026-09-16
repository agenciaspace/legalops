import { describe, expect, it } from 'vitest'
import { hasClubProAccess, isClubProPath, normalizeLinkedInProfile, validateClubProfile } from '@/lib/club-membership'
import { hasActiveClubAccess } from '@/lib/community'
const profile = { full_name: 'Pessoa Teste', current_role: 'Analista', organization_name: 'Em transição', city: 'São Paulo', public_bio: 'Trabalho com processos e tecnologia para equipes jurídicas.', sector: 'legal_ops', linkedin_url: 'https://br.linkedin.com/in/pessoa/?trk=profile', interests: ['Legal Operations'], accepted_rules: true }
describe('Club admission and Pro separation', () => {
  it('admits a complete professional profile without a CV or subscription fields', () => {
    const result = validateClubProfile({ ...profile, club_pro_status: 'active', club_plan: 'founder_199' })
    expect(result.profile?.linkedin_url).toBe('https://www.linkedin.com/in/pessoa')
    expect(result.profile).not.toHaveProperty('club_pro_status')
    expect(result.profile).not.toHaveProperty('club_plan')
  })
  it('requires LinkedIn, professional context, relevant interests and rules', () => {
    for (const patch of [{ linkedin_url: '' }, { sector: 'unrelated' }, { public_bio: 'oi' }, { interests: ['unrelated'] }, { accepted_rules: false }]) expect(validateClubProfile({ ...profile, ...patch }).error).toBeTruthy()
  })
  it('rejects company/search URLs and deceptive LinkedIn hosts', () => {
    for (const url of ['https://linkedin.com.evil.com/in/test', 'https://linkedin.com@evil.com/in/test', 'https://linkedin.com/company/acme', 'https://linkedin.com/jobs/search', 'http://linkedin.com/in/test']) expect(normalizeLinkedInProfile(url)).toBeNull()
  })
  it('keeps a free member in the community without granting Pro', () => {
    const member = { club_access_status: 'active', club_access_expires_at: null, club_pro_status: 'inactive' }
    expect(hasActiveClubAccess(member)).toBe(true)
    expect(hasClubProAccess(member)).toBe(false)
  })
  it('expires Pro independently from community access', () => {
    const member = { club_access_status: 'active', club_pro_status: 'active', club_pro_expires_at: '2020-01-01' }
    expect(hasActiveClubAccess(member)).toBe(true)
    expect(hasClubProAccess(member)).toBe(false)
    expect(hasClubProAccess({ club_pro_status: 'complimentary' })).toBe(true)
  })
  it('separates community conversations and directory from AI and personalized integrations', () => {
    for (const path of ['/community', '/community/members', '/community/profile', '/community/calendar', '/api/pipeline']) expect(isClubProPath(path)).toBe(false)
    for (const path of ['/community/agents', '/community/summaries', '/community/jobs', '/api/ai/cover-letter', '/api/profile/linkedin-insights', '/api/pipeline/id/cv', '/api/pipeline/id/leader']) expect(isClubProPath(path)).toBe(true)
  })
})
