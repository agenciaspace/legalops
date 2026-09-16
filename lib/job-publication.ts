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

export function isLinkedInJobUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:'
      && hostMatches(url.hostname.toLowerCase(), 'linkedin.com')
      && /^\/jobs\/view\/(?:[^/]+-)?\d{6,}\/?$/.test(url.pathname)
  } catch {
    return false
  }
}

export function isPublishableJobUrl(value: string): boolean {
  return isDirectJobUrl(value) || isLinkedInJobUrl(value)
}

export function hasStructuredJobDetails(html: string): boolean {
  function containsPosting(value: unknown): boolean {
    if (Array.isArray(value)) return value.some(containsPosting)
    if (!value || typeof value !== 'object') return false
    const record = value as Record<string, unknown>
    const organization = record.hiringOrganization as Record<string, unknown> | undefined
    const types = Array.isArray(record['@type']) ? record['@type'] : [record['@type']]
    return (types.includes('JobPosting')
      && typeof record.title === 'string' && Boolean(record.title.trim())
      && typeof record.description === 'string' && Boolean(record.description.trim())
      && typeof organization?.name === 'string' && Boolean(organization.name.trim()))
      || containsPosting(record['@graph'])
  }
  for (const match of Array.from(html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))) {
    try {
      if (containsPosting(JSON.parse(match[1]))) return true
    } catch {
      // Incomplete metadata does not establish that a job page is available.
    }
  }
  return false
}

export function hasPublicLinkedInJobDetails(html: string, pageUrl: string): boolean {
  if (hasStructuredJobDetails(html)) return true
  const jobId = new URL(pageUrl).pathname.match(/(\d{6,})\/?$/)?.[1]
  const visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  const textForClass = (className: string) => {
    const match = visible.match(new RegExp(`<([a-z][a-z0-9]*)\\b[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/\\1>`, 'i'))
    return match?.[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() ?? ''
  }
  // Public LinkedIn detail pages sometimes omit JSON-LD. Require the complete
  // detail view and its matching job ID, rather than accepting a login/search page.
  return Boolean(jobId && visible.includes(`urn:li:jobPosting:${jobId}"`)
    && textForClass('topcard__title')
    && textForClass('topcard__org-name-link')
    && textForClass('show-more-less-html__markup').length >= 100
    && /<button\b[^>]*id=["']topbar-apply["'][^>]*>/i.test(visible))
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
  return job.urlStatus === 'live' && isPublishableJobUrl(job.url) && Boolean(job.companyLogoUrl)
}
