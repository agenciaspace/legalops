export type CandidateProfileForReadiness = {
  full_name?: string | null
  current_role?: string | null
  desired_roles?: string[] | null
  areas_of_expertise?: string[] | null
  career_summary?: string | null
  base_cv_text?: string | null
}

const REMOTE_PREFERENCES = new Set(['remote', 'hybrid', 'onsite', 'any'])
const PROFESSIONAL_TYPES = new Set(['law_firm', 'legal_dept', 'public_sector', 'freelance', 'other'])

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  const cleaned = value.trim().replace(/\s+/g, ' ')
  return cleaned ? cleaned.slice(0, maxLength) : ''
}

function cleanLongText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  const cleaned = value.trim()
  return cleaned ? cleaned.slice(0, maxLength) : ''
}

function cleanTextArray(value: unknown, limit = 20, itemLimit = 120): string[] | null {
  if (!Array.isArray(value)) return null
  const unique = new Map<string, string>()
  for (const item of value) {
    const cleaned = cleanText(item, itemLimit)
    if (!cleaned) continue
    const key = cleaned.toLocaleLowerCase('pt-BR')
    if (!unique.has(key)) unique.set(key, cleaned)
    if (unique.size >= limit) break
  }
  return Array.from(unique.values())
}

export function normalizeCandidateProfilePatch(body: Record<string, unknown>) {
  const patch: Record<string, unknown> = {}

  const shortFields: Array<[string, number]> = [
    ['full_name', 160],
    ['current_role', 160],
    ['linkedin_url', 500],
    ['public_headline', 180],
    ['organization_name', 180],
  ]
  for (const [field, maxLength] of shortFields) {
    const value = cleanText(body[field], maxLength)
    if (value !== null) patch[field] = value || null
  }

  const longFields: Array<[string, number]> = [
    ['public_bio', 3000],
    ['career_summary', 3000],
    ['base_cv_text', 30000],
  ]
  for (const [field, maxLength] of longFields) {
    const value = cleanLongText(body[field], maxLength)
    if (value !== null) patch[field] = value || null
  }

  const arrayFields: Array<[string, number, number]> = [
    ['desired_roles', 10, 120],
    ['areas_of_expertise', 20, 120],
    ['skills', 30, 100],
    ['tools_used', 30, 100],
    ['preferred_locations', 15, 120],
    ['career_highlights', 12, 500],
  ]
  for (const [field, limit, itemLimit] of arrayFields) {
    const value = cleanTextArray(body[field], limit, itemLimit)
    if (value !== null) patch[field] = value
  }

  if (typeof body.years_experience === 'number' && Number.isInteger(body.years_experience)) {
    patch.years_experience = Math.max(0, Math.min(70, body.years_experience))
  } else if (body.years_experience === null) {
    patch.years_experience = null
  }

  if (typeof body.professional_type === 'string' && PROFESSIONAL_TYPES.has(body.professional_type)) {
    patch.professional_type = body.professional_type
  }
  if (typeof body.preferred_remote === 'string' && REMOTE_PREFERENCES.has(body.preferred_remote)) {
    patch.preferred_remote = body.preferred_remote
  }

  for (const field of ['open_to_opportunities', 'job_alerts_enabled', 'cv_suggestions_enabled', 'is_public']) {
    if (typeof body[field] === 'boolean') patch[field] = body[field]
  }

  if (body.linkedin_data !== undefined && body.linkedin_data !== null && typeof body.linkedin_data === 'object') {
    patch.linkedin_data = body.linkedin_data
  }

  return patch
}

export function isCandidateProfileReady(profile: CandidateProfileForReadiness | null | undefined) {
  return Boolean(
    profile?.full_name?.trim()
    && profile.current_role?.trim()
    && (profile.desired_roles?.length ?? 0) > 0
    && (profile.areas_of_expertise?.length ?? 0) > 0
    && profile.career_summary?.trim()
    && profile.base_cv_text?.trim(),
  )
}
