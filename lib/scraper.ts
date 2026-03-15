import { stripHtml, extractJobMetaFromHtml, extractSalaryFromHtml, buildMetadataBlock, type ExtractedSalary } from './utils'
import type { SourceBoard } from './types'

export type RawJob = {
  title: string
  url: string
  source_board: SourceBoard
  company: string
  location?: string | null
  salary_range?: string | null
  listing_url?: string | null
}

export interface ScrapeAllBoardsResult {
  jobs: RawJob[]
  discoverySource: 'firecrawl' | 'legacy'
  fallbackReason: string | null
}

interface FirecrawlJobListing {
  jobTitle?: string
  jobTitle_citation?: string
  companyName?: string
  companyName_citation?: string
  location?: string
  location_citation?: string
  salaryRange?: string
  salaryRange_citation?: string
  applicationLink?: string
  applicationLink_citation?: string
}

interface FirecrawlScrapeResponse {
  success?: boolean
  data?: {
    metadata?: { creditsUsed?: number }
    json?: {
      jobListings?: FirecrawlJobListing[]
    }
  }
  error?: string
}

const FIRECRAWL_SCRAPE_URL = 'https://api.firecrawl.dev/v2/scrape'

const FIRECRAWL_SCRAPE_TARGETS = [
  'https://www.indeed.com/jobs?q=%22Legal+Operations%22&sort=date',
  'https://www.indeed.com/jobs?q=%22Legal+Ops%22&sort=date',
  'https://www.goinhouse.com/jobs/search?q=Legal+Operations',
  'https://jobs.cloc.org/jobs?keywords=Legal+Operations',
]

const FIRECRAWL_EXTRACT_SCHEMA = {
  type: 'object',
  properties: {
    jobListings: {
      type: 'array',
      description: 'List of job listings found on this page',
      items: {
        type: 'object',
        properties: {
          jobTitle: {
            type: 'string',
            description: 'Job title',
          },
          companyName: {
            type: 'string',
            description: 'Company name',
          },
          location: {
            type: 'string',
            description: 'Job location (city, state/country)',
          },
          salaryRange: {
            type: 'string',
            description: 'Salary or compensation range if shown on the page (e.g. "$120,000 - $180,000/year")',
          },
          applicationLink: {
            type: 'string',
            description: 'Direct link to apply or view the full job posting',
          },
        },
        required: ['jobTitle', 'companyName', 'applicationLink'],
      },
    },
  },
  required: ['jobListings'],
}

const FIRECRAWL_JOB_PAGE_SCHEMA = {
  type: 'object',
  properties: {
    salaryMin: {
      type: 'string',
      description: 'Minimum salary/compensation amount (e.g. "$120,000", "R$15.000")',
    },
    salaryMax: {
      type: 'string',
      description: 'Maximum salary/compensation amount (e.g. "$180,000", "R$25.000")',
    },
    salaryCurrency: {
      type: 'string',
      description: 'Currency code (USD, BRL, EUR, GBP, etc.)',
    },
    salaryPeriod: {
      type: 'string',
      description: 'Pay period: "year", "month", or "hour"',
    },
    salaryRaw: {
      type: 'string',
      description: 'The full salary/compensation text as shown on the page (e.g. "$120,000 - $180,000 per year")',
    },
  },
  required: [],
}

export const COMPANY_SLUGS = {
  greenhouse: ['nubank', 'ifood', 'totvs', 'vtex', 'loft', 'gympass', 'creditas'],
  lever: ['stone', 'pagarme', 'dock', 'ebanx', 'nuvemshop'],
  workable: ['jusbrasil', 'lalamove-brazil'],
  gupy: ['itau', 'bradesco', 'ambev', 'embraer', 'raizen'],
} as const

function cleanString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function cleanUrl(value: unknown): string | null {
  const text = cleanString(value)
  if (!text) return null

  try {
    return new URL(text).toString()
  } catch {
    return null
  }
}

function getFirstUrl(...values: unknown[]): string | null {
  for (const value of values) {
    const url = cleanUrl(value)
    if (url) return url
  }

  return null
}

export function matchesLegalOpsTitle(title: string): boolean {
  return /\blegal\s+(operations|ops)\b/i.test(title)
}

export function filterByKeywords(jobs: { title: string; url: string }[]): typeof jobs {
  return jobs.filter(job => matchesLegalOpsTitle(job.title))
}

export function inferSourceBoardFromUrl(url: string): SourceBoard {
  try {
    const hostname = new URL(url).hostname.toLowerCase()

    if (hostname.includes('greenhouse')) return 'greenhouse'
    if (hostname.includes('lever.co')) return 'lever'
    if (hostname === 'gupy.io' || hostname.endsWith('.gupy.io')) return 'gupy'
    if (hostname.includes('workable.com')) return 'workable'
    if (hostname.includes('indeed.com')) return 'indeed'
    if (hostname.includes('linkedin.com')) return 'linkedin'
    if (hostname === 'jobs.cloc.org' || hostname === 'cloc.org') return 'cloc'
    if (hostname.includes('legal.io')) return 'legalio'
    if (hostname.includes('legaloperators.com')) return 'legaloperators'
    if (hostname.includes('goinhouse.com')) return 'goinhouse'
    if (hostname.includes('firecrawl.dev')) return 'firecrawl'

    return 'company_site'
  } catch {
    return 'firecrawl'
  }
}

function cleanSalary(value: unknown): string | null {
  const text = cleanString(value)
  if (!text) return null
  const lower = text.toLowerCase()
  if (
    lower === 'not specified' ||
    lower === 'not listed' ||
    lower === 'n/a' ||
    lower === 'full-time' ||
    lower === 'part-time' ||
    lower.startsWith('pay information not')
  ) {
    return null
  }
  return text
}

export function normalizeFirecrawlJobListing(listing: FirecrawlJobListing): RawJob | null {
  const title = cleanString(listing.jobTitle)
  const company = cleanString(listing.companyName)
  const applicationLink = cleanUrl(listing.applicationLink)

  if (!title || !company || !applicationLink) {
    return null
  }

  const listingUrl = getFirstUrl(
    listing.jobTitle_citation,
    listing.companyName_citation,
    listing.location_citation,
    listing.salaryRange_citation,
    listing.applicationLink_citation
  )

  return {
    title,
    company,
    url: applicationLink,
    source_board: inferSourceBoardFromUrl(listingUrl ?? applicationLink),
    location: cleanString(listing.location),
    salary_range: cleanSalary(listing.salaryRange),
    listing_url: listingUrl,
  }
}

export function extractFirecrawlJobsFromPayload(payload: unknown): RawJob[] {
  const jobListings =
    payload &&
    typeof payload === 'object' &&
    'jobListings' in payload &&
    Array.isArray((payload as { jobListings?: unknown }).jobListings)
      ? (payload as { jobListings: FirecrawlJobListing[] }).jobListings
      : payload &&
          typeof payload === 'object' &&
          'data' in payload &&
          (payload as { data?: unknown }).data &&
          typeof (payload as { data?: unknown }).data === 'object' &&
          Array.isArray(
            ((payload as { data?: { jobListings?: unknown[] } }).data?.jobListings ?? null)
          )
        ? ((payload as { data?: { jobListings?: FirecrawlJobListing[] } }).data?.jobListings ?? [])
        : []

  return dedupeJobsByUrl(
    jobListings
      .map(normalizeFirecrawlJobListing)
      .filter((job): job is RawJob => job !== null)
  )
}

export function buildJobDiscoverySeed(job: RawJob): string {
  const lines = [
    `Discovery source: ${job.source_board}`,
    `Job title: ${job.title}`,
    `Company: ${job.company}`,
  ]

  if (job.location) {
    lines.push(`Location: ${job.location}`)
  }

  if (job.salary_range) {
    lines.push(`Salary range: ${job.salary_range}`)
  }

  if (job.listing_url && job.listing_url !== job.url) {
    lines.push(`Listing page: ${job.listing_url}`)
  }

  lines.push(`Application link: ${job.url}`)

  return lines.join('\n')
}

export function dedupeJobsByUrl(jobs: RawJob[]): RawJob[] {
  const seen = new Map<string, RawJob>()

  for (const job of jobs) {
    const key = job.url.toLowerCase()
    if (!seen.has(key)) {
      seen.set(key, job)
    }
  }

  return Array.from(seen.values())
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseGreenhouseJobs(data: any, slug: string): RawJob[] {
  if (!data?.jobs) return []
  return data.jobs
    .map((job: { title: string; absolute_url: string; location?: { name?: string }; content?: string }) => {
      const raw: RawJob = {
        title: job.title,
        url: job.absolute_url,
        source_board: 'greenhouse' as const,
        company: slug,
      }
      if (job.location?.name) raw.location = job.location.name
      return raw
    })
    .filter((job: RawJob) => matchesLegalOpsTitle(job.title))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseLeverJobs(data: any[], slug: string): RawJob[] {
  if (!Array.isArray(data)) return []
  return data
    .map((job: { text: string; hostedUrl: string; categories?: { location?: string; commitment?: string }; salaryRange?: { min?: number; max?: number; currency?: string } }) => {
      const raw: RawJob = {
        title: job.text,
        url: job.hostedUrl,
        source_board: 'lever' as const,
        company: slug,
      }
      if (job.categories?.location) raw.location = job.categories.location
      if (job.salaryRange?.min || job.salaryRange?.max) {
        const parts = [job.salaryRange?.min, job.salaryRange?.max].filter(Boolean)
        const currency = job.salaryRange?.currency ?? ''
        raw.salary_range = currency ? `${parts.join(' - ')} ${currency}` : parts.join(' - ')
      }
      return raw
    })
    .filter((job: RawJob) => matchesLegalOpsTitle(job.title))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseWorkableJobs(data: any, slug: string): RawJob[] {
  if (!data?.results) return []
  return data.results
    .map((job: { title: string; url: string; location?: { city?: string; region?: string; country?: string }; salary?: { salary_from?: number; salary_to?: number; currency?: string } }) => {
      const raw: RawJob = {
        title: job.title,
        url: job.url,
        source_board: 'workable' as const,
        company: slug,
      }
      if (job.location) {
        const locParts = [job.location.city, job.location.region, job.location.country].filter(Boolean)
        if (locParts.length > 0) raw.location = locParts.join(', ')
      }
      if (job.salary?.salary_from || job.salary?.salary_to) {
        const parts = [job.salary.salary_from, job.salary.salary_to].filter(Boolean)
        const currency = job.salary.currency ?? ''
        raw.salary_range = currency ? `${parts.join(' - ')} ${currency}` : String(parts.join(' - '))
      }
      return raw
    })
    .filter((job: RawJob) => matchesLegalOpsTitle(job.title))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseGupyJobs(data: any, slug: string): RawJob[] {
  if (!Array.isArray(data)) return []
  return data
    .map((job: { name: string; jobUrl: string; city?: string; state?: string; country?: string; type?: string; salaryFrom?: number; salaryTo?: number }) => {
      const raw: RawJob = {
        title: job.name,
        url: job.jobUrl,
        source_board: 'gupy' as const,
        company: slug,
      }
      const locParts = [job.city, job.state, job.country].filter(Boolean)
      if (locParts.length > 0) raw.location = locParts.join(', ')
      if (job.salaryFrom || job.salaryTo) {
        const parts = [job.salaryFrom, job.salaryTo].filter(Boolean).map(v => `R$${v}`)
        raw.salary_range = parts.join(' - ')
      }
      return raw
    })
    .filter((job: RawJob) => matchesLegalOpsTitle(job.title))
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'LegalOpsCRM/1.0' },
    signal: AbortSignal.timeout(10_000),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`)
  }

  return response.json()
}

export async function scrapeLegacyBoards(): Promise<RawJob[]> {
  const results: RawJob[] = []

  for (const slug of COMPANY_SLUGS.greenhouse) {
    try {
      const data = await fetchJson(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`)
      results.push(...parseGreenhouseJobs(data, slug))
    } catch (error) {
      console.error(`[scraper] greenhouse/${slug} failed:`, error)
    }
  }

  for (const slug of COMPANY_SLUGS.lever) {
    try {
      const data = (await fetchJson(
        `https://api.lever.co/v0/postings/${slug}?mode=json`
      )) as unknown[]
      results.push(...parseLeverJobs(data, slug))
    } catch (error) {
      console.error(`[scraper] lever/${slug} failed:`, error)
    }
  }

  for (const slug of COMPANY_SLUGS.workable) {
    try {
      const data = await fetchJson(`https://${slug}.workable.com/api/v1/jobs`)
      results.push(...parseWorkableJobs(data, slug))
    } catch (error) {
      console.error(`[scraper] workable/${slug} failed:`, error)
    }
  }

  for (const slug of COMPANY_SLUGS.gupy) {
    try {
      const data = (await fetchJson(`https://${slug}.gupy.io/api/job-openings`)) as unknown[]
      results.push(...parseGupyJobs(data, slug))
    } catch (error) {
      console.error(`[scraper] gupy/${slug} failed:`, error)
    }
  }

  return dedupeJobsByUrl(results)
}

async function scrapeOneBoard(apiKey: string, url: string): Promise<FirecrawlJobListing[]> {
  const response = await fetch(FIRECRAWL_SCRAPE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: [{ type: 'json', schema: FIRECRAWL_EXTRACT_SCHEMA }],
    }),
    signal: AbortSignal.timeout(30_000),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    console.error(`[firecrawl] scrape failed for ${url}: HTTP ${response.status} ${body.slice(0, 300)}`)
    return []
  }

  const result = (await response.json()) as FirecrawlScrapeResponse

  if (!result.success) {
    console.error(`[firecrawl] scrape error for ${url}: ${result.error}`)
    return []
  }

  const credits = result.data?.metadata?.creditsUsed ?? 0
  const listings = result.data?.json?.jobListings ?? []
  console.info(`[firecrawl] ${url} → ${listings.length} listings (${credits} credits)`)
  return listings
}

export async function scrapeJobsWithFirecrawl(): Promise<RawJob[]> {
  const apiKey = cleanString(process.env.FIRECRAWL_API_KEY)
  if (!apiKey) return []

  const targets = (cleanString(process.env.FIRECRAWL_SCRAPE_URLS) ?? '')
    .split(',')
    .map(u => u.trim())
    .filter(Boolean)

  const urls = targets.length > 0 ? targets : FIRECRAWL_SCRAPE_TARGETS

  const allListings = await Promise.all(
    urls.map(url => scrapeOneBoard(apiKey, url).catch(err => {
      console.error(`[firecrawl] ${url} threw:`, err)
      return [] as FirecrawlJobListing[]
    }))
  )

  return extractFirecrawlJobsFromPayload({
    jobListings: allListings.flat(),
  })
}

export async function scrapeAllBoards(): Promise<ScrapeAllBoardsResult> {
  try {
    const firecrawlJobs = await scrapeJobsWithFirecrawl()

    if (firecrawlJobs.length > 0) {
      console.info(`[scraper] Firecrawl returned ${firecrawlJobs.length} jobs`)
      return {
        jobs: firecrawlJobs,
        discoverySource: 'firecrawl',
        fallbackReason: null,
      }
    }
  } catch (error) {
    console.error('[scraper] Firecrawl discovery failed, falling back to legacy boards:', error)

    const legacyJobs = await scrapeLegacyBoards()
    console.info(`[scraper] legacy boards returned ${legacyJobs.length} jobs`)
    return {
      jobs: legacyJobs,
      discoverySource: 'legacy',
      fallbackReason: error instanceof Error ? error.message : 'firecrawl_failed',
    }
  }

  const legacyJobs = await scrapeLegacyBoards()
  console.info(`[scraper] legacy boards returned ${legacyJobs.length} jobs`)
  return {
    jobs: legacyJobs,
    discoverySource: 'legacy',
    fallbackReason: 'firecrawl_returned_zero_jobs',
  }
}

export interface FetchJobResult {
  description: string
  extractedSalary: ExtractedSalary | null
}

export async function fetchJobDescription(url: string): Promise<FetchJobResult> {
  // Try Firecrawl first (handles JS rendering and anti-bot)
  const apiKey = cleanString(process.env.FIRECRAWL_API_KEY)
  if (apiKey) {
    try {
      const result = await fetchJobDescriptionWithFirecrawl(apiKey, url)
      if (result.description) return result
    } catch (err) {
      console.error(`[firecrawl] job page fetch failed for ${url}:`, err)
    }
  }

  // Fallback to direct fetch
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'LegalOpsCRM/1.0' },
      signal: AbortSignal.timeout(15_000),
    })

    if (!response.ok) return { description: '', extractedSalary: null }

    const html = await response.text()

    const meta = extractJobMetaFromHtml(html)
    const metaBlock = buildMetadataBlock(meta)
    const text = stripHtml(html)

    const description = metaBlock
      ? `${metaBlock}\n\n${text}`.slice(0, 8_000)
      : text.slice(0, 8_000)

    return { description, extractedSalary: meta.salary }
  } catch {
    return { description: '', extractedSalary: null }
  }
}

async function fetchJobDescriptionWithFirecrawl(apiKey: string, url: string): Promise<FetchJobResult> {
  const response = await fetch(FIRECRAWL_SCRAPE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: [
        'markdown',
        'html',
        { type: 'json', schema: FIRECRAWL_JOB_PAGE_SCHEMA },
      ],
    }),
    signal: AbortSignal.timeout(30_000),
  })

  if (!response.ok) {
    console.error(`[firecrawl] job page HTTP ${response.status} for ${url}`)
    return { description: '', extractedSalary: null }
  }

  const result = await response.json() as {
    success?: boolean
    data?: {
      markdown?: string
      html?: string
      json?: {
        salaryMin?: string
        salaryMax?: string
        salaryCurrency?: string
        salaryPeriod?: string
        salaryRaw?: string
      }
    }
  }

  if (!result.success || !result.data) {
    return { description: '', extractedSalary: null }
  }

  // Extract salary from structured JSON extraction
  const json = result.data.json
  let extractedSalary: ExtractedSalary | null = null

  if (json?.salaryMin || json?.salaryMax || json?.salaryRaw) {
    extractedSalary = {
      min: json.salaryMin ?? null,
      max: json.salaryMax ?? null,
      currency: json.salaryCurrency ?? null,
      period: json.salaryPeriod ?? null,
      raw: json.salaryRaw ?? [json.salaryMin, json.salaryMax].filter(Boolean).join(' - '),
    }
  }

  // Also try extracting salary from raw HTML (Greenhouse, JSON-LD, etc.)
  const html = result.data.html ?? ''
  if (!extractedSalary && html) {
    extractedSalary = extractSalaryFromHtml(html)
  }

  const markdown = result.data.markdown ?? ''
  const description = markdown.slice(0, 8_000)

  console.info(`[firecrawl] job page ${url} → ${description.length} chars, salary: ${extractedSalary ? 'yes' : 'no'}`)

  return { description, extractedSalary }
}
