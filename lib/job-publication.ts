const BLOCKED_JOB_HOSTS = [
  'linkedin.com',
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'twitter.com',
  'x.com',
  'indeed.com',
  'glassdoor.com',
  'jooble.org',
  'adzuna.com',
  'vaga-ja.com',
  'trabajo.org',
  'jobsora.com',
  'bebee.com',
  'talent.com',
  'simplyhired.com',
  'careerjet.com',
  'jobscouts.com',
  'jobs.cloc.org',
  'legal.io',
  'legaloperators.com',
  'goinhouse.com',
] as const

function hostMatches(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`)
}

export function isBlockedJobSourceUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname.toLowerCase().replace(/^www\./, '')
    return BLOCKED_JOB_HOSTS.some(domain => hostMatches(hostname, domain))
  } catch {
    return true
  }
}

export function isSafePublicHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false

    const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      /^172\.(?:1[6-9]|2\d|3[01])\./.test(hostname) ||
      /^169\.254\./.test(hostname)
    ) {
      return false
    }
    return true
  } catch {
    return false
  }
}

export function isDirectJobUrl(value: string): boolean {
  return isSafePublicHttpUrl(value) && !isBlockedJobSourceUrl(value)
}

function htmlAttribute(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i'))
  return match?.[2]?.replace(/&amp;/gi, '&').trim() || null
}

function looksLikeApplicationLink(tag: string, href: string): boolean {
  const text = tag.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return /(?:apply|application|candidat|inscrev|vaga|job|career)/i.test(`${text} ${href}`)
}

export function extractDirectApplicationLinks(html: string, pageUrl: string): string[] {
  const urls = new Set<string>()

  for (const match of Array.from(html.matchAll(/<a\b[^>]*href\s*=\s*(["'])[^"']+\1[^>]*>[\s\S]*?<\/a>/gi))) {
    const href = htmlAttribute(match[0], 'href')
    if (!href || !looksLikeApplicationLink(match[0], href)) continue
    try {
      const resolved = new URL(href, pageUrl).toString()
      if (isDirectJobUrl(resolved)) urls.add(resolved)
    } catch {
      // Ignore malformed discovery links.
    }
  }

  return Array.from(urls)
}

export function isPublishableJobRecord(job: {
  url: string
  urlStatus: string | null
  companyLogoUrl?: string | null
}): boolean {
  return job.urlStatus === 'live' && isDirectJobUrl(job.url) && Boolean(job.companyLogoUrl)
}
