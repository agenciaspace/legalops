import { allowsEntitlement } from '@/lib/bend-access'

export const CLUB_SECTORS = [
  ['legal_dept', 'Departamento jurídico'],
  ['law_firm', 'Escritório de advocacia'],
  ['legal_ops', 'Legal Operations'],
  ['legal_tech', 'Tecnologia para o jurídico'],
  ['public_sector', 'Jurídico no setor público'],
  ['freelance', 'Consultoria ou atuação independente no jurídico'],
  ['education', 'Estudo, pesquisa ou transição para a área jurídica'],
] as const

export const CLUB_INTERESTS = ['Legal Operations', 'Contratos / CLM', 'Tecnologia jurídica', 'IA e automação', 'Dados e indicadores', 'Gestão jurídica', 'Carreira'] as const

export function normalizeLinkedInProfile(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null
    if (!/^(?:[a-z]{2,3}\.)?linkedin\.com$/i.test(url.hostname)) return null
    if (!/^\/in\/[^/?#\s]+\/?$/.test(url.pathname)) return null
    return `https://www.linkedin.com${url.pathname.replace(/\/$/, '')}`
  } catch { return null }
}

export function validateClubProfile(body: Record<string, unknown>) {
  const text = (key: string, max: number) => typeof body[key] === 'string' ? (body[key] as string).trim().slice(0, max) : ''
  const fullName = text('full_name', 160)
  const role = text('current_role', 160)
  const organization = text('organization_name', 180)
  const city = text('city', 120)
  const bio = text('public_bio', 1500)
  const sector = text('sector', 30)
  const linkedin = normalizeLinkedInProfile(body.linkedin_url)
  const interests = Array.isArray(body.interests)
    ? Array.from(new Set(body.interests.filter(value => CLUB_INTERESTS.includes(value as typeof CLUB_INTERESTS[number])))) as string[] : []
  if (fullName.length < 3 || role.length < 2 || organization.length < 2 || city.length < 2 || bio.length < 30) {
    return { error: 'Preencha nome, atuação, organização ou contexto, cidade e uma apresentação com pelo menos 30 caracteres.' } as const
  }
  if (!linkedin) return { error: 'Informe seu perfil pessoal: https://www.linkedin.com/in/seu-perfil.' } as const
  if (!CLUB_SECTORS.some(([value]) => value === sector)) return { error: 'Selecione sua relação com o trabalho jurídico.' } as const
  if (!interests.length) return { error: 'Escolha ao menos um assunto de interesse.' } as const
  if (body.accepted_rules !== true) return { error: 'Confirme que leu as regras de participação.' } as const
  const professionalType = ['legal_ops', 'legal_tech', 'education'].includes(sector) ? 'other' : sector
  return { profile: { full_name: fullName, current_role: role, organization_name: organization, preferred_locations: [city], public_bio: bio, linkedin_url: linkedin, professional_type: professionalType, areas_of_expertise: interests } } as const
}

export type ClubProAccess = {
  club_pro_status?: string | null
  club_pro_expires_at?: string | null
}

export function hasClubProAccess(access?: ClubProAccess | null, now = new Date()): boolean {
  const enabled = Boolean(access && ['active', 'complimentary'].includes(access.club_pro_status ?? ''))
  const valid = Boolean(access && (!access.club_pro_expires_at || new Date(access.club_pro_expires_at).getTime() > now.getTime()))
  return allowsEntitlement(enabled, valid)
}

export function isClubProPath(path: string): boolean {
  return ['/api/club/agent', '/community/summaries', '/community/jobs', '/api/ai', '/api/profile/linkedin-insights'].some(prefix => path === prefix || path.startsWith(`${prefix}/`))
    || /^\/api\/pipeline\/[^/]+\/(?:cv|leader)(?:\/|$)/.test(path)
}
