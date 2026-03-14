import type { AccountProfile, CompanyJob, Job, ScoreBreakdown } from './types'

/**
 * Match score weights (total = 100)
 */
const WEIGHTS = {
  expertise_overlap: 40,
  experience_fit: 20,
  professional_type_match: 15,
  remote_preference: 10,
  title_relevance: 15,
}

/**
 * Calculate match score between a candidate profile and a company-posted job.
 * Returns a score from 0 to 100 with breakdown.
 */
export function calculateCompanyJobMatch(
  profile: AccountProfile,
  job: CompanyJob
): { score: number; breakdown: ScoreBreakdown } {
  const breakdown: ScoreBreakdown = {
    expertise_overlap: calcExpertiseOverlap(profile.areas_of_expertise, job.areas_of_expertise),
    experience_fit: calcExperienceFit(profile.years_experience, job.required_experience_years),
    professional_type_match: calcProfessionalTypeMatch(profile.professional_type, job.professional_type),
    remote_preference: 1, // neutral for company jobs without user preference data
    title_relevance: calcTitleRelevance(profile.current_role, job.title),
  }

  const score =
    breakdown.expertise_overlap * WEIGHTS.expertise_overlap +
    breakdown.experience_fit * WEIGHTS.experience_fit +
    breakdown.professional_type_match * WEIGHTS.professional_type_match +
    breakdown.remote_preference * WEIGHTS.remote_preference +
    breakdown.title_relevance * WEIGHTS.title_relevance

  return { score: Math.round(score * 100) / 100, breakdown }
}

/**
 * Calculate match score between a candidate profile and a crawled job.
 * Uses text analysis on the raw description since crawled jobs lack structured fields.
 */
export function calculateCrawledJobMatch(
  profile: AccountProfile,
  job: Job
): { score: number; breakdown: ScoreBreakdown } {
  const descLower = (job.raw_description + ' ' + job.title).toLowerCase()

  const breakdown: ScoreBreakdown = {
    expertise_overlap: calcTextExpertiseMatch(profile.areas_of_expertise, descLower),
    experience_fit: calcTextExperienceFit(profile.years_experience, descLower),
    professional_type_match: calcTextProfessionalMatch(profile.professional_type, descLower),
    remote_preference: 1,
    title_relevance: calcTitleRelevance(profile.current_role, job.title),
  }

  const score =
    breakdown.expertise_overlap * WEIGHTS.expertise_overlap +
    breakdown.experience_fit * WEIGHTS.experience_fit +
    breakdown.professional_type_match * WEIGHTS.professional_type_match +
    breakdown.remote_preference * WEIGHTS.remote_preference +
    breakdown.title_relevance * WEIGHTS.title_relevance

  return { score: Math.round(score * 100) / 100, breakdown }
}

// --- Scoring helpers ---

function calcExpertiseOverlap(candidateAreas: string[], jobAreas: string[]): number {
  if (!jobAreas.length || !candidateAreas.length) return 0.5 // neutral when data missing
  const overlap = candidateAreas.filter(a => jobAreas.includes(a)).length
  return Math.min(overlap / Math.max(jobAreas.length, 1), 1)
}

function calcExperienceFit(candidateYears: number | null, requiredYears: number | null): number {
  if (candidateYears == null || requiredYears == null) return 0.5
  const diff = candidateYears - requiredYears
  if (diff >= 0 && diff <= 3) return 1       // ideal fit
  if (diff > 3) return 0.7                    // overqualified
  if (diff >= -2) return 0.6                  // slightly under
  return 0.2                                  // significantly under
}

function calcProfessionalTypeMatch(
  candidateType: string | null,
  jobType: string | null
): number {
  if (!candidateType || !jobType) return 0.5
  return candidateType === jobType ? 1 : 0.3
}

function calcTitleRelevance(currentRole: string | null, jobTitle: string): number {
  if (!currentRole) return 0.5
  const roleLower = currentRole.toLowerCase()
  const titleLower = jobTitle.toLowerCase()

  // Exact or near-exact match
  if (titleLower.includes(roleLower) || roleLower.includes(titleLower)) return 1

  // Check for shared significant words (3+ chars)
  const roleWords = roleLower.split(/\s+/).filter(w => w.length >= 3)
  const titleWords = titleLower.split(/\s+/).filter(w => w.length >= 3)
  const shared = roleWords.filter(w => titleWords.some(tw => tw.includes(w) || w.includes(tw)))

  if (shared.length >= 2) return 0.8
  if (shared.length === 1) return 0.5
  return 0.2
}

// --- Text-based matching for crawled jobs ---

const EXPERTISE_KEYWORDS: Record<string, string[]> = {
  'Legal Operations': ['legal ops', 'legal operations', 'operações jurídicas', 'operacoes juridicas', 'gestão jurídica'],
  'Contratos/CLM': ['contrato', 'contratos', 'clm', 'contract', 'gestão de contratos'],
  'Compliance': ['compliance', 'conformidade', 'auditoria', 'anticorrupção'],
  'M&A': ['m&a', 'fusões', 'aquisições', 'merger', 'acquisition', 'due diligence'],
  'Trabalhista': ['trabalhista', 'labor', 'employment', 'direito do trabalho'],
  'Tributário': ['tributário', 'tributario', 'fiscal', 'tax', 'tributos'],
  'Regulatório': ['regulatório', 'regulatorio', 'regulatory', 'anvisa', 'anatel'],
  'PI': ['propriedade intelectual', 'intellectual property', 'patente', 'marca', 'pi'],
  'LGPD': ['lgpd', 'gdpr', 'proteção de dados', 'privacidade', 'data protection', 'privacy'],
  'LegalTech': ['legaltech', 'legal tech', 'jurimetria', 'lawtech', 'tecnologia jurídica'],
  'Contencioso': ['contencioso', 'litigation', 'litígio', 'processo judicial'],
  'ESG': ['esg', 'sustentabilidade', 'sustainability', 'governança corporativa'],
  'Mercado de Capitais': ['mercado de capitais', 'capital markets', 'cvm', 'valores mobiliários'],
  'Direito Bancário': ['direito bancário', 'bancario', 'banking law', 'financeiro'],
}

function calcTextExpertiseMatch(candidateAreas: string[], descLower: string): number {
  if (!candidateAreas.length) return 0.5
  let matches = 0
  for (const area of candidateAreas) {
    const keywords = EXPERTISE_KEYWORDS[area] ?? [area.toLowerCase()]
    if (keywords.some(kw => descLower.includes(kw))) {
      matches++
    }
  }
  return matches > 0 ? Math.min(matches / candidateAreas.length, 1) : 0.1
}

function calcTextExperienceFit(candidateYears: number | null, descLower: string): number {
  if (candidateYears == null) return 0.5
  // Try to extract experience requirement from description
  const match = descLower.match(/(\d+)\s*(?:\+\s*)?(?:anos?|years?)/)
  if (!match) return 0.5
  const requiredYears = parseInt(match[1], 10)
  return calcExperienceFit(candidateYears, requiredYears)
}

function calcTextProfessionalMatch(candidateType: string | null, descLower: string): number {
  if (!candidateType) return 0.5
  const typeKeywords: Record<string, string[]> = {
    law_firm: ['escritório', 'escritorio', 'law firm', 'advocacia', 'banca'],
    legal_dept: ['departamento jurídico', 'departamento juridico', 'jurídico corporativo', 'in-house', 'legal department'],
    public_sector: ['setor público', 'setor publico', 'governo', 'government', 'público'],
    freelance: ['freelance', 'autônomo', 'autonomo', 'consultor independente'],
  }
  const keywords = typeKeywords[candidateType]
  if (!keywords) return 0.5
  return keywords.some(kw => descLower.includes(kw)) ? 0.8 : 0.4
}

/**
 * Minimum score threshold for a match to be saved
 */
export const MATCH_THRESHOLD = 25
