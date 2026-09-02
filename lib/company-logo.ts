function attribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i'))
  return match?.[2]?.replace(/&amp;/g, '&').trim() || null
}

function safeImageUrl(value: unknown, pageUrl: string): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const resolved = new URL(value.trim(), pageUrl)
    return ['http:', 'https:'].includes(resolved.protocol) ? resolved.toString() : null
  } catch {
    return null
  }
}

const CURATED_COMPANY_LOGOS: Record<string, string> = {
  'sleder aran genta advogados': 'https://sleder.adv.br/wp-content/uploads/2026/05/3-1-185x185.png',
  'radar da gestao': 'https://radardagestao.com.br/metadata/icon.png',
  wellhub: 'https://wellhub.com/image/favicon.svg',
  natura: 'https://www.natura.com.br/natura/favicon.png',
  'hero seguros': 'https://heroseguros.com.br/favicon.ico',
  'job duck': 'https://jobduck.com/wp-content/uploads/2023/11/favicon-300x300.png',
}

function companyKey(company: string): string {
  return company
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('pt-BR')
}

export function curatedCompanyLogoUrl(company: string): string | null {
  return CURATED_COMPANY_LOGOS[companyKey(company)] ?? null
}

export function resolveCompanyLogoUrl(
  company: string,
  ...candidates: Array<string | null | undefined>
): string | null {
  const curated = curatedCompanyLogoUrl(company)
  if (curated) return curated

  for (const candidate of candidates) {
    const safe = safeImageUrl(candidate, 'https://legalops.work')
    if (safe?.startsWith('https://')) return safe
  }
  return null
}

export function companyLogoDisplayUrl(company: string, logoUrl?: string | null): string | null {
  return resolveCompanyLogoUrl(company, logoUrl)
    ?? (companyKey(company) === 'empresa confidencial' ? '/company-logos/confidential.svg' : null)
}

function flatten(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(flatten)
  if (!value || typeof value !== 'object') return []
  const record = value as Record<string, unknown>
  return [record, ...flatten(record['@graph'])]
}

function logoFromOrganization(organization: unknown, pageUrl: string) {
  if (!organization || typeof organization !== 'object') return null
  const logo = (organization as Record<string, unknown>).logo
  if (typeof logo === 'string') return safeImageUrl(logo, pageUrl)
  if (logo && typeof logo === 'object') {
    const record = logo as Record<string, unknown>
    return safeImageUrl(record.url, pageUrl) ?? safeImageUrl(record.contentUrl, pageUrl)
  }
  return null
}

function organizationFromStructuredValue(value: Record<string, unknown>): Record<string, unknown> | null {
  const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']]
  const organization = types.some(type => typeof type === 'string' && /organization/i.test(type))
    ? value
    : value.hiringOrganization
  return organization && typeof organization === 'object'
    ? organization as Record<string, unknown>
    : null
}

export function extractCompanyWebsiteFromHtml(html: string, pageUrl: string): string | null {
  const scripts = Array.from(html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))
  for (const match of scripts) {
    try {
      for (const value of flatten(JSON.parse(match[1].trim()))) {
        const website = safeImageUrl(organizationFromStructuredValue(value)?.url, pageUrl)
        if (website) return website
      }
    } catch {
      // Ignore malformed JSON-LD.
    }
  }
  return null
}

export function extractCompanyLogoFromHtml(html: string, pageUrl: string): string | null {
  const scripts = Array.from(html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))
  for (const match of scripts) {
    try {
      for (const value of flatten(JSON.parse(match[1].trim()))) {
        const organization = organizationFromStructuredValue(value)
        const logo = logoFromOrganization(organization, pageUrl)
        if (logo) return logo
      }
    } catch {
      // Metadata fallbacks below still work for pages with malformed JSON-LD.
    }
  }

  // A square site icon is a better small-card logo than a wide social preview.
  for (const tag of Array.from(html.matchAll(/<link\b[^>]*>/gi), match => match[0])) {
    if (!(attribute(tag, 'rel') ?? '').toLowerCase().includes('icon')) continue
    const logo = safeImageUrl(attribute(tag, 'href'), pageUrl)
    if (logo) return logo
  }

  for (const tag of Array.from(html.matchAll(/<meta\b[^>]*>/gi), match => match[0])) {
    const property = attribute(tag, 'property') ?? attribute(tag, 'name')
    if (!property || !['og:logo', 'og:image', 'twitter:image'].includes(property.toLowerCase())) continue
    const logo = safeImageUrl(attribute(tag, 'content'), pageUrl)
    if (logo) return logo
  }
  return null
}
