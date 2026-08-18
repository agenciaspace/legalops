import {
  canonicalizeJobUrl,
  mapWithConcurrency,
  matchesLegalOpsTitle,
  matchesTargetMarket,
  scrapeLegacyBoards,
} from './scraper'

export type DiscoverySource =
  | 'greenhouse'
  | 'lever'
  | 'workable'
  | 'gupy'
  | 'ashby'
  | 'company_site'
  | 'jooble'
  | 'adzuna'

export interface DiscoveredJob {
  title: string
  url: string
  source_board: DiscoverySource | string
  company: string
  location?: string | null
  salary_range?: string | null
  listing_url?: string | null
  posted_at?: string | null
  accepts_brazil?: boolean
}

export interface JobDiscoveryResult {
  jobs: DiscoveredJob[]
  discoverySource: 'direct_ats' | 'company_site' | 'aggregator' | 'combined' | 'none'
  counts: {
    legacy: number
    ashby: number
    companySite: number
    jooble: number
    adzuna: number
  }
  succeeded: {
    legacy: boolean
    ashby: boolean
    companySite: boolean
    jooble: boolean
    adzuna: boolean
  }
  errors: string[]
}

export interface JobDiscoveryOptions {
  joobleApiKey?: string | null
  adzunaAppId?: string | null
  adzunaAppKey?: string | null
}

interface SourceOutcome {
  ok: boolean
  jobs: DiscoveredJob[]
  error?: string
}

const DEFAULT_ASHBY_BOARDS = [
  'enter-ai',
  'ethereum-foundation',
  'openai',
  'ashby',
  'baseten',
  'solana foundation',
  'suno',
  'claylabs',
  'gamma',
  'sei-labs',
  'column',
  'applied',
  'vultr',
  'norm-ai',
]

const DEFAULT_CAREER_SITES = [
  'https://wellhub.com/careers/',
  'https://international.nubank.com.br/pt-br/carreiras/',
  'https://carreiras.ifood.com.br/jobs/',
  'https://career.mercadolibre.com/pt',
]

const JOB_URL_HINT = /(?:\/|^)(?:jobs?|careers?|vagas?|oportunidades?|openings?|positions?)(?:\/|\?|$)/i
const LATAM_TEXT = /\b(?:brazil|brasil|latam|latin america|south america|s[aã]o paulo|rio de janeiro|belo horizonte|bras[ií]lia|curitiba|porto alegre|florian[oó]polis|recife|salvador|fortaleza|goi[aâ]nia|campinas|manaus)\b/i
const INTERN_TITLE = /\b(?:intern(?:ship)?|est[aá]gio|estagi[aá]ri[oa])\b/i
const REQUEST_TIMEOUT_MS = 12_000
const SITE_URL_LIMIT = 24

function envList(name: string, fallback: readonly string[]): string[] {
  const configured = process.env[name]
    ?.split(',')
    .map(value => value.trim())
    .filter(Boolean)
  return configured && configured.length > 0 ? configured : Array.from(fallback)
}

function eligibleTitle(title: string): boolean {
  return matchesLegalOpsTitle(title) && !INTERN_TITLE.test(title)
}

function cleanString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function cleanUrl(value: unknown, base?: string): string | null {
  const raw = cleanString(value)
  if (!raw) return null
  try {
    const url = base ? new URL(raw, base) : new URL(raw)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return canonicalizeJobUrl(url.toString())
  } catch {
    return null
  }
}

function cleanDate(value: unknown): string | null {
  const raw = cleanString(value)
  if (!raw) return null
  const timestamp = Date.parse(raw)
  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString()
}

function locationAcceptsBrazil(location: string | null | undefined, text = ''): boolean {
  return matchesTargetMarket(location) || LATAM_TEXT.test(`${location ?? ''} ${text}`)
}

async function fetchText(url: string): Promise<{ text: string; finalUrl: string }> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'LegalOpsWork/2.0 (+https://legalops.work)',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`)
  return { text: await response.text(), finalUrl: response.url || url }
}

async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  const headers = new Headers(init?.headers)
  headers.set('User-Agent', 'LegalOpsWork/2.0 (+https://legalops.work)')
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')

  const response = await fetch(url, {
    ...init,
    headers,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`HTTP ${response.status} for ${url}${body ? `: ${body.slice(0, 160)}` : ''}`)
  }
  return response.json()
}

function dedupe(jobs: DiscoveredJob[]): DiscoveredJob[] {
  const seen = new Map<string, DiscoveredJob>()
  for (const job of jobs) {
    const url = canonicalizeJobUrl(job.url)
    const key = url.toLowerCase()
    if (!seen.has(key)) {
      seen.set(key, {
        ...job,
        url,
        listing_url: job.listing_url ? canonicalizeJobUrl(job.listing_url) : job.listing_url,
      })
    }
  }
  return Array.from(seen.values())
}

function formatLocation(parts: Array<string | null | undefined>): string | null {
  const cleaned = parts.map(part => part?.trim()).filter(Boolean) as string[]
  return cleaned.length > 0 ? Array.from(new Set(cleaned)).join(', ') : null
}

function salaryFromAshby(job: Record<string, unknown>): string | null {
  const compensation = job.compensation as Record<string, unknown> | undefined
  return cleanString(compensation?.scrapeableCompensationSalarySummary)
    ?? cleanString(compensation?.compensationTierSummary)
}

export function parseAshbyJobs(payload: unknown, board: string): DiscoveredJob[] {
  const jobs = payload && typeof payload === 'object' && Array.isArray((payload as { jobs?: unknown[] }).jobs)
    ? (payload as { jobs: Record<string, unknown>[] }).jobs
    : []

  return jobs.flatMap(job => {
    const title = cleanString(job.title)
    const url = cleanUrl(job.applyUrl) ?? cleanUrl(job.jobUrl)
    if (!title || !url || !eligibleTitle(title) || job.isListed === false) return []

    const secondary = Array.isArray(job.secondaryLocations)
      ? (job.secondaryLocations as Array<Record<string, unknown>>)
          .map(value => cleanString(value.location))
          .filter((value): value is string => Boolean(value))
      : []
    const primaryLocation = cleanString(job.location)
    const location = formatLocation([primaryLocation].concat(secondary))
    const description = cleanString(job.descriptionPlain) ?? ''
    const remote = job.isRemote === true || job.workplaceType === 'Remote'
    const acceptsBrazil = locationAcceptsBrazil(location, remote ? description : '')

    if (!acceptsBrazil) return []

    return [{
      title,
      url,
      source_board: 'ashby',
      company: board,
      location,
      salary_range: salaryFromAshby(job),
      listing_url: cleanUrl(job.jobUrl),
      posted_at: cleanDate(job.publishedAt),
      accepts_brazil: true,
    }]
  })
}

export async function scrapeAshbyBoards(): Promise<DiscoveredJob[]> {
  const boards = envList('LEGALOPS_ASHBY_BOARDS', DEFAULT_ASHBY_BOARDS)
  const settled = await mapWithConcurrency(boards, 5, async board => {
    const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(board)}?includeCompensation=true`
    return parseAshbyJobs(await fetchJson(url), board)
  })

  const jobs: DiscoveredJob[] = []
  for (let index = 0; index < settled.length; index++) {
    const result = settled[index]
    if (result.status === 'fulfilled') jobs.push(...result.value)
    else console.error(`[discovery] ashby/${boards[index]} failed:`, result.reason)
  }
  return dedupe(jobs)
}

interface JoobleJob {
  title?: string
  location?: string
  snippet?: string
  salary?: string
  source?: string
  type?: string
  link?: string
  company?: string
  updated?: string
}

export function parseJoobleJobs(payload: unknown): DiscoveredJob[] {
  const jobs = payload && typeof payload === 'object' && Array.isArray((payload as { jobs?: unknown[] }).jobs)
    ? (payload as { jobs: JoobleJob[] }).jobs
    : []

  return jobs.flatMap(job => {
    const title = cleanString(job.title)
    const url = cleanUrl(job.link)
    const company = cleanString(job.company)
    const location = cleanString(job.location)
    if (!title || !url || !company || !eligibleTitle(title)) return []
    if (!locationAcceptsBrazil(location, job.snippet ?? '')) return []

    return [{
      title,
      url,
      source_board: 'jooble',
      company,
      location,
      salary_range: cleanString(job.salary),
      listing_url: url,
      posted_at: cleanDate(job.updated),
      accepts_brazil: true,
    }]
  })
}

export async function scrapeJooble(apiKey: string | null | undefined): Promise<DiscoveredJob[]> {
  if (!apiKey) return []
  const origin = process.env.JOOBLE_API_ORIGIN?.replace(/\/$/, '') || 'https://br.jooble.org'
  const endpoint = `${origin}/api/${encodeURIComponent(apiKey)}`
  const payload = await fetchJson(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      keywords: 'legal operations, legal ops, operações jurídicas, controladoria jurídica, CLM',
      location: 'Brasil',
      radius: '80',
      page: 1,
      ResultOnPage: 50,
      companysearch: false,
    }),
  })
  return dedupe(parseJoobleJobs(payload))
}

interface AdzunaResult {
  title?: string
  description?: string
  created?: string
  redirect_url?: string
  salary_min?: number
  salary_max?: number
  company?: { display_name?: string }
  location?: { display_name?: string }
}

export function parseAdzunaJobs(payload: unknown): DiscoveredJob[] {
  const jobs = payload && typeof payload === 'object' && Array.isArray((payload as { results?: unknown[] }).results)
    ? (payload as { results: AdzunaResult[] }).results
    : []

  return jobs.flatMap(job => {
    const title = cleanString(job.title)
    const url = cleanUrl(job.redirect_url)
    const company = cleanString(job.company?.display_name)
    const location = cleanString(job.location?.display_name)
    if (!title || !url || !company || !eligibleTitle(title)) return []
    if (!locationAcceptsBrazil(location, job.description ?? '')) return []

    const salaryParts = [job.salary_min, job.salary_max].filter(value => typeof value === 'number')
    return [{
      title,
      url,
      source_board: 'adzuna',
      company,
      location,
      salary_range: salaryParts.length ? `R$ ${salaryParts.join(' - ')}` : null,
      listing_url: url,
      posted_at: cleanDate(job.created),
      accepts_brazil: true,
    }]
  })
}

export async function scrapeAdzuna(appId: string | null | undefined, appKey: string | null | undefined): Promise<DiscoveredJob[]> {
  if (!appId || !appKey) return []
  const url = new URL('https://api.adzuna.com/v1/api/jobs/br/search/1')
  url.searchParams.set('app_id', appId)
  url.searchParams.set('app_key', appKey)
  url.searchParams.set('results_per_page', '50')
  url.searchParams.set('what', 'legal operations legal ops CLM operações jurídicas')
  url.searchParams.set('where', 'Brasil')
  url.searchParams.set('sort_by', 'date')
  url.searchParams.set('content-type', 'application/json')
  return dedupe(parseAdzunaJobs(await fetchJson(url.toString())))
}

function objectArray(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.filter(item => Boolean(item) && typeof item === 'object') as Record<string, unknown>[]
  }
  return value && typeof value === 'object' ? [value as Record<string, unknown>] : []
}

function flattenJsonLd(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(flattenJsonLd)
  if (!value || typeof value !== 'object') return []
  const object = value as Record<string, unknown>
  const nested = Array.isArray(object['@graph']) ? flattenJsonLd(object['@graph']) : []
  return [object].concat(nested)
}

function typeIncludesJobPosting(value: unknown): boolean {
  const values = Array.isArray(value) ? value : [value]
  return values.some(type => String(type).toLowerCase() === 'jobposting')
}

function jsonLdLocation(posting: Record<string, unknown>): string | null {
  const values: string[] = []

  for (const location of objectArray(posting.jobLocation)) {
    const address = location.address
    if (typeof address === 'string') {
      values.push(address)
      continue
    }
    if (address && typeof address === 'object') {
      const record = address as Record<string, unknown>
      const formatted = formatLocation([
        cleanString(record.addressLocality),
        cleanString(record.addressRegion),
        cleanString(record.addressCountry),
      ])
      if (formatted) values.push(formatted)
    }
  }

  for (const location of objectArray(posting.applicantLocationRequirements)) {
    const name = cleanString(location.name)
    if (name) values.push(name)
  }

  return values.length ? Array.from(new Set(values)).join('; ') : null
}

function jsonLdSalary(posting: Record<string, unknown>): string | null {
  const baseSalary = posting.baseSalary as Record<string, unknown> | undefined
  if (!baseSalary) return null
  const currency = cleanString(baseSalary.currency) ?? ''
  const value = baseSalary.value as Record<string, unknown> | number | undefined
  if (typeof value === 'number') return `${value} ${currency}`.trim()
  if (!value || typeof value !== 'object') return null
  const min = typeof value.minValue === 'number' ? value.minValue : null
  const max = typeof value.maxValue === 'number' ? value.maxValue : null
  const exact = typeof value.value === 'number' ? value.value : null
  const numbers = min != null || max != null
    ? [min, max].filter((item): item is number => item != null)
    : exact != null ? [exact] : []
  return numbers.length ? `${numbers.join(' - ')} ${currency}`.trim() : null
}

export function extractJobPostingsFromHtml(html: string, pageUrl: string): DiscoveredJob[] {
  const scripts = Array.from(html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))
  const jobs: DiscoveredJob[] = []

  for (const match of scripts) {
    let parsed: unknown
    try {
      parsed = JSON.parse(match[1].trim())
    } catch {
      continue
    }

    for (const posting of flattenJsonLd(parsed)) {
      if (!typeIncludesJobPosting(posting['@type'])) continue
      const title = cleanString(posting.title)
      if (!title || !eligibleTitle(title)) continue

      const organization = posting.hiringOrganization as Record<string, unknown> | undefined
      const company = cleanString(organization?.name) ?? (() => {
        try { return new URL(pageUrl).hostname.replace(/^www\./, '') } catch { return 'empresa' }
      })()
      const location = jsonLdLocation(posting)
      const description = cleanString(posting.description) ?? ''
      const remote = cleanString(posting.jobLocationType)?.toUpperCase() === 'TELECOMMUTE'
      const acceptsBrazil = locationAcceptsBrazil(location, remote ? description : '')
      if (!acceptsBrazil) continue

      const validThrough = cleanDate(posting.validThrough)
      if (validThrough && Date.parse(validThrough) < Date.now()) continue

      const url = cleanUrl(posting.url, pageUrl) ?? canonicalizeJobUrl(pageUrl)
      jobs.push({
        title,
        url,
        source_board: 'company_site',
        company,
        location,
        salary_range: jsonLdSalary(posting),
        listing_url: canonicalizeJobUrl(pageUrl),
        posted_at: cleanDate(posting.datePosted),
        accepts_brazil: true,
      })
    }
  }

  return dedupe(jobs)
}

function sitemapUrls(xml: string): string[] {
  return Array.from(xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi))
    .map(match => match[1].replace(/&amp;/g, '&').trim())
    .filter(Boolean)
}

function htmlLinks(html: string, baseUrl: string): string[] {
  return Array.from(html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi))
    .map(match => cleanUrl(match[1], baseUrl))
    .filter((value): value is string => Boolean(value))
}

function looksLikeJobUrl(value: string): boolean {
  try {
    return JOB_URL_HINT.test(new URL(value).pathname)
  } catch {
    return false
  }
}

async function candidateUrlsForCareerSite(site: string): Promise<string[]> {
  const siteUrl = new URL(site)
  const candidates = new Set<string>()

  try {
    const root = await fetchText(site)
    for (const link of htmlLinks(root.text, root.finalUrl)) {
      if (looksLikeJobUrl(link)) candidates.add(link)
    }
    if (extractJobPostingsFromHtml(root.text, root.finalUrl).length) candidates.add(root.finalUrl)
  } catch (error) {
    console.error(`[discovery] career root ${site} failed:`, error)
  }

  try {
    const sitemapUrl = new URL('/sitemap.xml', siteUrl.origin).toString()
    const rootSitemap = await fetchText(sitemapUrl)
    const rootUrls = sitemapUrls(rootSitemap.text)
    const childSitemaps = rootUrls.filter(url => /sitemap/i.test(url)).slice(0, 8)
    const pageUrls = rootUrls.filter(url => !/sitemap/i.test(url))

    for (const url of pageUrls) {
      if (looksLikeJobUrl(url)) candidates.add(canonicalizeJobUrl(url))
    }

    const childResults = await mapWithConcurrency(childSitemaps, 3, async url => sitemapUrls((await fetchText(url)).text))
    for (const result of childResults) {
      if (result.status !== 'fulfilled') continue
      for (const url of result.value) {
        if (looksLikeJobUrl(url)) candidates.add(canonicalizeJobUrl(url))
      }
    }
  } catch (error) {
    console.error(`[discovery] sitemap ${siteUrl.origin} failed:`, error)
  }

  return Array.from(candidates).slice(0, SITE_URL_LIMIT)
}

export async function scrapeCompanySites(): Promise<DiscoveredJob[]> {
  const sites = envList('LEGALOPS_CAREER_SITES', DEFAULT_CAREER_SITES)
  const candidateResults = await mapWithConcurrency(sites, 3, candidateUrlsForCareerSite)
  const candidateSet = new Set<string>()
  for (const result of candidateResults) {
    if (result.status !== 'fulfilled') continue
    for (const url of result.value) candidateSet.add(url)
  }
  const candidates = Array.from(candidateSet).slice(0, 60)

  const pageResults = await mapWithConcurrency(candidates, 5, async url => {
    const page = await fetchText(url)
    return extractJobPostingsFromHtml(page.text, page.finalUrl)
  })

  return dedupe(pageResults.flatMap(result => result.status === 'fulfilled' ? result.value : []))
}

async function safeSource(name: string, run: () => Promise<DiscoveredJob[]>): Promise<SourceOutcome> {
  try {
    return { ok: true, jobs: await run() }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[discovery] ${name} failed:`, message)
    return { ok: false, jobs: [], error: `${name}: ${message}` }
  }
}

export async function discoverJobs(options: JobDiscoveryOptions = {}): Promise<JobDiscoveryResult> {
  const [legacy, ashby, company, jooble, adzuna] = await Promise.all([
    safeSource('direct_ats', async () => (await scrapeLegacyBoards()).map(job => ({ ...job, source_board: String(job.source_board) }))),
    safeSource('ashby', scrapeAshbyBoards),
    safeSource('company_site', scrapeCompanySites),
    safeSource('jooble', () => scrapeJooble(options.joobleApiKey)),
    safeSource('adzuna', () => scrapeAdzuna(options.adzunaAppId, options.adzunaAppKey)),
  ])

  const jobs = dedupe([].concat(
    legacy.jobs as never[],
    ashby.jobs as never[],
    company.jobs as never[],
    jooble.jobs as never[],
    adzuna.jobs as never[],
  ) as DiscoveredJob[])

  const directCount = legacy.jobs.length + ashby.jobs.length
  const aggregatorCount = jooble.jobs.length + adzuna.jobs.length
  const activeGroups = [directCount > 0, company.jobs.length > 0, aggregatorCount > 0].filter(Boolean).length
  const discoverySource = activeGroups > 1
    ? 'combined' as const
    : directCount > 0
      ? 'direct_ats' as const
      : company.jobs.length > 0
        ? 'company_site' as const
        : aggregatorCount > 0
          ? 'aggregator' as const
          : 'none' as const

  const errors = [legacy.error, ashby.error, company.error, jooble.error, adzuna.error]
    .filter((value): value is string => Boolean(value))

  return {
    jobs,
    discoverySource,
    counts: {
      legacy: legacy.jobs.length,
      ashby: ashby.jobs.length,
      companySite: company.jobs.length,
      jooble: jooble.jobs.length,
      adzuna: adzuna.jobs.length,
    },
    succeeded: {
      legacy: legacy.ok,
      ashby: ashby.ok,
      companySite: company.ok,
      jooble: jooble.ok,
      adzuna: adzuna.ok,
    },
    errors,
  }
}

export function buildMultiSourceDiscoverySeed(job: DiscoveredJob): string {
  const lines = [
    `Discovery source: ${job.source_board}`,
    `Job title: ${job.title}`,
    `Company: ${job.company}`,
  ]
  if (job.location) lines.push(`Location: ${job.location}`)
  if (job.salary_range) lines.push(`Salary range: ${job.salary_range}`)
  if (job.listing_url && job.listing_url !== job.url) lines.push(`Listing page: ${job.listing_url}`)
  if (job.posted_at) lines.push(`Posted at: ${job.posted_at}`)
  lines.push(`Application link: ${job.url}`)
  return lines.join('\n')
}
