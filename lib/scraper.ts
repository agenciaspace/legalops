import { stripHtml } from './utils'
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

interface FirecrawlAgentCreateResponse {
  success?: boolean
  id?: string
  error?: string
}

interface FirecrawlAgentStatusResponse {
  success?: boolean
  status?: string
  data?: {
    jobListings?: FirecrawlJobListing[]
  } | null
  jobListings?: FirecrawlJobListing[]
  error?: string
}

const FIRECRAWL_AGENT_URL = 'https://api.firecrawl.dev/v2/agent'
const DEFAULT_FIRECRAWL_MODEL = 'spark-1-mini'
const DEFAULT_FIRECRAWL_TIMEOUT_MS = 45_000
const DEFAULT_FIRECRAWL_POLL_INTERVAL_MS = 2_000
const DEFAULT_FIRECRAWL_MAX_CREDITS = 80
const DEFAULT_FIRECRAWL_PROMPT =
  "Extract only job listings where the job title explicitly includes 'Legal Operations' or 'Legal Ops'. Exclude general legal roles like 'Paralegal', 'Attorney', 'Counsel', or 'Compliance' unless they are specifically for a Legal Operations function. Search globally across all platforms, including LinkedIn, CLOC, Legal.io, LegalOperators, and Goinhouse. For each listing, include the job title, company name, location, salary range (if available), and the direct application link."

const FIRECRAWL_JOB_SCHEMA = {
  type: 'object',
  properties: {
    jobListings: {
      type: 'array',
      description: 'List of specific Legal Operations job listings',
      items: {
        type: 'object',
        properties: {
          jobTitle: {
            type: 'string',
            description: "Job title (must contain 'Legal Operations' or 'Legal Ops')",
          },
          jobTitle_citation: {
            type: 'string',
            description: 'Source URL for jobTitle',
          },
          companyName: {
            type: 'string',
            description: 'Company name',
          },
          companyName_citation: {
            type: 'string',
            description: 'Source URL for companyName',
          },
          location: {
            type: 'string',
            description: 'Job location',
          },
          location_citation: {
            type: 'string',
            description: 'Source URL for location',
          },
          salaryRange: {
            type: 'string',
            description: 'Salary range (if provided)',
          },
          salaryRange_citation: {
            type: 'string',
            description: 'Source URL for salaryRange',
          },
          applicationLink: {
            type: 'string',
            description: 'Link to apply for the job',
          },
          applicationLink_citation: {
            type: 'string',
            description: 'Source URL for applicationLink',
          },
        },
        required: ['jobTitle', 'companyName', 'location', 'applicationLink'],
      },
    },
  },
  required: ['jobListings'],
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

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
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

export function normalizeFirecrawlJobListing(listing: FirecrawlJobListing): RawJob | null {
  const title = cleanString(listing.jobTitle)
  const company = cleanString(listing.companyName)
  const applicationLink = cleanUrl(listing.applicationLink)

  if (!title || !company || !applicationLink || !matchesLegalOpsTitle(title)) {
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
    salary_range: cleanString(listing.salaryRange),
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
    .map((job: { title: string; absolute_url: string }) => ({
      title: job.title,
      url: job.absolute_url,
      source_board: 'greenhouse' as const,
      company: slug,
    }))
    .filter((job: RawJob) => matchesLegalOpsTitle(job.title))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseLeverJobs(data: any[], slug: string): RawJob[] {
  if (!Array.isArray(data)) return []
  return data
    .map((job: { text: string; hostedUrl: string }) => ({
      title: job.text,
      url: job.hostedUrl,
      source_board: 'lever' as const,
      company: slug,
    }))
    .filter((job: RawJob) => matchesLegalOpsTitle(job.title))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseWorkableJobs(data: any, slug: string): RawJob[] {
  if (!data?.results) return []
  return data.results
    .map((job: { title: string; url: string }) => ({
      title: job.title,
      url: job.url,
      source_board: 'workable' as const,
      company: slug,
    }))
    .filter((job: RawJob) => matchesLegalOpsTitle(job.title))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseGupyJobs(data: any, slug: string): RawJob[] {
  if (!Array.isArray(data)) return []
  return data
    .map((job: { name: string; jobUrl: string }) => ({
      title: job.name,
      url: job.jobUrl,
      source_board: 'gupy' as const,
      company: slug,
    }))
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
      const data = await fetchJson(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`)
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

export async function scrapeJobsWithFirecrawl(): Promise<RawJob[]> {
  const apiKey = cleanString(process.env.FIRECRAWL_API_KEY)
  if (!apiKey) return []

  const response = await fetch(FIRECRAWL_AGENT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: cleanString(process.env.FIRECRAWL_JOB_PROMPT) ?? DEFAULT_FIRECRAWL_PROMPT,
      schema: FIRECRAWL_JOB_SCHEMA,
      model: cleanString(process.env.FIRECRAWL_MODEL) ?? DEFAULT_FIRECRAWL_MODEL,
      maxCredits:
        Number.parseInt(process.env.FIRECRAWL_AGENT_MAX_CREDITS ?? '', 10) ||
        DEFAULT_FIRECRAWL_MAX_CREDITS,
    }),
    signal: AbortSignal.timeout(15_000),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Firecrawl create agent failed with ${response.status}: ${body.slice(0, 500)}`)
  }

  const created = (await response.json()) as FirecrawlAgentCreateResponse
  if (!created.id) {
    throw new Error(created.error ?? 'Firecrawl create agent response did not include an id')
  }

  const timeoutMs =
    Number.parseInt(process.env.FIRECRAWL_AGENT_TIMEOUT_MS ?? '', 10) ||
    DEFAULT_FIRECRAWL_TIMEOUT_MS
  const pollIntervalMs =
    Number.parseInt(process.env.FIRECRAWL_AGENT_POLL_INTERVAL_MS ?? '', 10) ||
    DEFAULT_FIRECRAWL_POLL_INTERVAL_MS
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    await sleep(pollIntervalMs)

    const statusResponse = await fetch(`${FIRECRAWL_AGENT_URL}/${created.id}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(15_000),
    })

    if (!statusResponse.ok) {
      const body = await statusResponse.text().catch(() => '')
      throw new Error(
        `Firecrawl get agent failed with ${statusResponse.status}: ${body.slice(0, 500)}`
      )
    }

    const status = (await statusResponse.json()) as FirecrawlAgentStatusResponse

    if (status.status === 'completed') {
      return extractFirecrawlJobsFromPayload(status)
    }

    if (status.status === 'failed' || status.status === 'cancelled') {
      throw new Error(status.error ?? `Firecrawl agent ended with status ${status.status}`)
    }
  }

  throw new Error(`Firecrawl agent timed out after ${timeoutMs}ms`)
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

export async function fetchJobDescription(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'LegalOpsCRM/1.0' },
      signal: AbortSignal.timeout(15_000),
    })

    if (!response.ok) return ''

    const html = await response.text()
    return stripHtml(html).slice(0, 8_000)
  } catch {
    return ''
  }
}
