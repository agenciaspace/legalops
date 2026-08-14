import { createAdminClient } from '@/lib/supabase-admin'
import type { RemoteReality } from '@/lib/types'

export type ClubJobProfile = {
  user_id: string
  current_role: string | null
  desired_roles: string[]
  areas_of_expertise: string[]
  skills: string[]
  tools_used: string[]
  preferred_remote: string | null
  open_to_opportunities: boolean
  job_alerts_enabled: boolean
  cv_suggestions_enabled: boolean
}

export type MatchableJob = {
  id: string
  title: string
  company: string
  raw_description: string
  remote_reality: string | null
  source_board: string
}

export type ClubJobMatch = {
  score: number
  reasons: string[]
  cvSuggestions: string[]
}

const STOP_WORDS = new Set([
  'and', 'assistant', 'associate', 'da', 'das', 'de', 'do', 'dos', 'em', 'especialista',
  'head', 'jr', 'junior', 'legal', 'manager', 'ops', 'pleno', 'senior', 'sr', 'the',
])

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

function meaningfulTokens(value: string) {
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter(token => token.length >= 3 && !STOP_WORDS.has(token))
}

function matchingTerms(terms: string[], haystack: string) {
  const normalizedHaystack = normalizeText(haystack)
  return terms.filter(term => {
    const normalizedTerm = normalizeText(term).trim()
    if (normalizedTerm.length < 3) return false
    if (normalizedHaystack.includes(normalizedTerm)) return true
    const tokens = meaningfulTokens(term)
    return tokens.length > 0 && tokens.every(token => normalizedHaystack.includes(token))
  })
}

function matchesDesiredRole(desiredRoles: string[], title: string) {
  const normalizedTitle = normalizeText(title)
  return desiredRoles.find(role => {
    const tokens = meaningfulTokens(role)
    return tokens.length > 0 && tokens.some(token => normalizedTitle.includes(token))
  }) ?? null
}

function remotePreferenceMatches(preference: string | null, remoteReality: string | null) {
  if (!preference || preference === 'any') return false
  if (preference === 'remote') {
    return remoteReality === 'fully_remote' || remoteReality === 'remote_with_travel'
  }
  if (preference === 'hybrid') return remoteReality === 'hybrid_disguised'
  return remoteReality === 'onsite'
}

export function buildClubJobMatch(profile: ClubJobProfile, job: MatchableJob): ClubJobMatch {
  const desiredRoles = profile.desired_roles.length > 0
    ? profile.desired_roles
    : profile.current_role ? [profile.current_role] : []
  const roleMatch = matchesDesiredRole(desiredRoles, job.title)
  const jobText = `${job.title} ${job.company} ${job.raw_description}`
  const expertiseMatches = matchingTerms(profile.areas_of_expertise, jobText).slice(0, 3)
  const skillMatches = matchingTerms(profile.skills, jobText).slice(0, 3)
  const toolMatches = matchingTerms(profile.tools_used, jobText).slice(0, 2)
  const preferredModel = remotePreferenceMatches(profile.preferred_remote, job.remote_reality)

  let score = 35
  if (roleMatch) score += 25
  score += Math.min(24, expertiseMatches.length * 8)
  score += Math.min(12, skillMatches.length * 4)
  score += Math.min(8, toolMatches.length * 4)
  if (preferredModel) score += 10

  const reasons: string[] = []
  if (roleMatch) reasons.push(`O cargo está próximo do objetivo "${roleMatch}".`)
  if (expertiseMatches.length > 0) reasons.push(`A vaga cita temas do seu perfil: ${expertiseMatches.join(', ')}.`)
  if (skillMatches.length > 0) reasons.push(`Há aderência com estas competências: ${skillMatches.join(', ')}.`)
  if (toolMatches.length > 0) reasons.push(`A descrição menciona ferramentas que você usa: ${toolMatches.join(', ')}.`)
  if (preferredModel) reasons.push('O modelo de trabalho corresponde à sua preferência.')
  if (reasons.length === 0) reasons.push('O crawler encontrou uma nova vaga na área de Legal Ops.')

  const cvSuggestions: string[] = []
  if (roleMatch) cvSuggestions.push(`Abra o resumo do CV com experiência ligada a ${roleMatch}.`)
  if (expertiseMatches.length > 0) {
    cvSuggestions.push(`Inclua um resultado mensurável envolvendo ${expertiseMatches.slice(0, 2).join(' e ')}.`)
  }
  if (toolMatches.length > 0) {
    cvSuggestions.push(`Descreva onde você usou ${toolMatches.join(' e ')}, não apenas o nome da ferramenta.`)
  }
  if (cvSuggestions.length === 0) {
    cvSuggestions.push(`Use no resumo profissional os termos do cargo "${job.title}" que descrevem sua experiência real.`)
  }

  return {
    score: Math.min(100, score),
    reasons,
    cvSuggestions: profile.cv_suggestions_enabled ? cvSuggestions : [],
  }
}

export async function generateClubJobAlerts(userId?: string) {
  const admin = createAdminClient()
  const now = new Date().toISOString()

  let memberQuery = admin
    .from('community_members')
    .select('user_id')
    .in('club_access_status', ['active', 'complimentary'])
    .or(`club_access_expires_at.is.null,club_access_expires_at.gt.${now}`)

  if (userId) memberQuery = memberQuery.eq('user_id', userId)

  const { data: members, error: memberError } = await memberQuery
  if (memberError) throw memberError

  const userIds = (members ?? []).map(member => member.user_id)
  if (userIds.length === 0) return { created: 0, eligibleMembers: 0 }

  const [{ data: profiles, error: profileError }, { data: jobs, error: jobError }] = await Promise.all([
    admin
      .from('account_profiles')
      .select('user_id, current_role, desired_roles, areas_of_expertise, skills, tools_used, preferred_remote, open_to_opportunities, job_alerts_enabled, cv_suggestions_enabled')
      .in('user_id', userIds)
      .eq('open_to_opportunities', true)
      .eq('job_alerts_enabled', true),
    admin
      .from('jobs')
      .select('id, title, company, raw_description, remote_reality, source_board')
      .eq('enrichment_status', 'done')
      .eq('url_status', 'live')
      .not('url_checked_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  if (profileError) throw profileError
  if (jobError) throw jobError

  const alerts = (profiles ?? []).flatMap(rawProfile => {
    const profile = rawProfile as ClubJobProfile
    return (jobs ?? []).map(rawJob => {
      const job = rawJob as MatchableJob
      const match = buildClubJobMatch(profile, job)
      return {
        user_id: profile.user_id,
        job_id: job.id,
        match_score: match.score,
        match_reasons: match.reasons,
        cv_suggestions: match.cvSuggestions,
      }
    })
  })

  if (alerts.length === 0) {
    return { created: 0, eligibleMembers: profiles?.length ?? 0 }
  }

  const { data: inserted, error: insertError } = await admin
    .from('club_job_alerts')
    .upsert(alerts, { onConflict: 'user_id,job_id', ignoreDuplicates: true })
    .select('id')

  if (insertError) throw insertError
  return { created: inserted?.length ?? 0, eligibleMembers: profiles?.length ?? 0 }
}

export function remoteRealityLabel(value: string | null) {
  const labels: Record<RemoteReality, string> = {
    fully_remote: 'Remoto',
    remote_with_travel: 'Remoto com viagens',
    hybrid_disguised: 'Híbrido',
    onsite: 'Presencial',
    unknown: 'Não informado',
  }
  return labels[(value ?? 'unknown') as RemoteReality] ?? labels.unknown
}
