import { stripHtml, extractJobMetaFromHtml, buildMetadataBlock, type ExtractedSalary } from './utils'
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
  discoverySource: 'firecrawl' | 'legacy' | 'combined'
  firecrawlCount: number
  legacyCount: number
  errors: string[]
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

interface FirecrawlAgentStartResponse {
  success?: boolean
  id?: string
  error?: string
}

interface FirecrawlAgentStatusResponse {
  success?: boolean
  status?: 'processing' | 'completed' | 'failed'
  data?: {
    jobListings?: FirecrawlJobListing[]
  }
  creditsUsed?: number
  error?: string
}

const FIRECRAWL_AGENT_URL = 'https://api.firecrawl.dev/v2/agent'

const FIRECRAWL_AGENT_PROMPT = `Find current job listings for Legal Operations roles. Search job boards like Indeed, GoInhouse, CLOC Jobs, Legal.io, and LegalOperators for positions with titles containing "Legal Operations", "Legal Ops", "Head of Legal", "General Counsel", "Chief Legal Officer", or "CLM Manager". Return all matching job listings with their title, company, location, salary range (if available), and application link.`

const FIRECRAWL_AGENT_POLL_INTERVAL_MS = 5_000
const FIRECRAWL_AGENT_TIMEOUT_MS = 120_000

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

export const COMPANY_SLUGS = {
  greenhouse: [
    'nubank', 'ifood', 'totvs', 'vtex', 'loft', 'gympass', 'creditas',
    'stripe', 'coinbase', 'cloudflare', 'notion', 'databricks', 'brex',
    'verkada', 'cohere-health', 'cerebras-systems', 'applied-intuition',
    'highlevel', 'hive', 'match-group', 'skylo', 'harbor',
    'neros-technologies', 'ipx', 'thinking-machines-lab',
    'airtable', 'plaid', 'figma', 'anduril', 'ramp',
  ],
  lever: [
    'stone', 'pagarme', 'dock', 'ebanx', 'nuvemshop',
    'netflix', 'affirm', 'nerdwallet', 'ironclad',
    'linktr.ee', 'drata', 'abridge',
  ],
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
  return /\b(?:legal\s+(?:operations?|ops)|contracts?\s*&\s*legal|legal\s+project|law\s+department\s+.*(?:operations?|strategy)|CLM\s+(?:manager|director|specialist|analyst|lead)|head\s+of\s+legal|general\s+counsel|chief\s+legal\s+officer)\b/i.test(title)
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

const LEGACY_CONCURRENCY = 6
const FETCH_RETRY_ATTEMPTS = 3
const FETCH_RETRY_BASE_MS = 1_000

async function fetchJsonOnce(url: string, timeoutMs = 10_000): Promise<unknown> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'LegalOpsCRM/1.0' },
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`)
  }

  return response.json()
}

async function fetchJson(url: string, timeoutMs = 10_000): Promise<unknown> {
  let lastError: unknown
  for (let attempt = 0; attempt < FETCH_RETRY_ATTEMPTS; attempt++) {
    try {
      return await fetchJsonOnce(url, timeoutMs)
    } catch (error) {
      lastError = error
      if (attempt < FETCH_RETRY_ATTEMPTS - 1) {
        await sleep(FETCH_RETRY_BASE_MS * 2 ** attempt)
      }
    }
  }
  throw lastError
}

export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length)
  let cursor = 0

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++
      try {
        results[index] = { status: 'fulfilled', value: await fn(items[index]) }
      } catch (reason) {
        results[index] = { status: 'rejected', reason }
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()))
  return results
}

interface BoardTask {
  board: string
  slug: string
  url: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parse: (data: any, slug: string) => RawJob[]
}

export async function scrapeLegacyBoards(): Promise<RawJob[]> {
  const tasks: BoardTask[] = [
    ...COMPANY_SLUGS.greenhouse.map(slug => ({
      board: 'greenhouse', slug,
      url: `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`,
      parse: parseGreenhouseJobs,
    })),
    ...COMPANY_SLUGS.lever.map(slug => ({
      board: 'lever', slug,
      url: `https://api.lever.co/v0/postings/${slug}?mode=json`,
      parse: parseLeverJobs,
    })),
    ...COMPANY_SLUGS.workable.map(slug => ({
      board: 'workable', slug,
      url: `https://${slug}.workable.com/api/v1/jobs`,
      parse: parseWorkableJobs,
    })),
    ...COMPANY_SLUGS.gupy.map(slug => ({
      board: 'gupy', slug,
      url: `https://${slug}.gupy.io/api/job-openings`,
      parse: parseGupyJobs,
    })),
  ]

  const settled = await mapWithConcurrency(tasks, LEGACY_CONCURRENCY, async (task) => {
    const data = await fetchJson(task.url)
    return task.parse(data, task.slug)
  })

  const results: RawJob[] = []
  for (let i = 0; i < settled.length; i++) {
    const r = settled[i]
    if (r.status === 'fulfilled') {
      results.push(...r.value)
    } else {
      console.error(`[scraper] ${tasks[i].board}/${tasks[i].slug} failed:`, r.reason)
    }
  }

  return dedupeJobsByUrl(results)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function runFirecrawlAgent(apiKey: string): Promise<FirecrawlJobListing[]> {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }

  // Start the agent job
  const startResponse = await fetch(FIRECRAWL_AGENT_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt: FIRECRAWL_AGENT_PROMPT,
      schema: FIRECRAWL_EXTRACT_SCHEMA,
      model: 'spark-1-mini',
      maxCredits: 500,
    }),
    signal: AbortSignal.timeout(30_000),
  })

  if (!startResponse.ok) {
    const body = await startResponse.text().catch(() => '')
    throw new Error(`[firecrawl] agent start failed: HTTP ${startResponse.status} ${body.slice(0, 300)}`)
  }

  const startResult = (await startResponse.json()) as FirecrawlAgentStartResponse

  if (!startResult.success || !startResult.id) {
    throw new Error(`[firecrawl] agent start error: ${startResult.error ?? 'no job id returned'}`)
  }

  const jobId = startResult.id
  console.info(`[firecrawl] agent started, job id: ${jobId}`)

  // Poll for completion
  const deadline = Date.now() + FIRECRAWL_AGENT_TIMEOUT_MS

  while (Date.now() < deadline) {
    await sleep(FIRECRAWL_AGENT_POLL_INTERVAL_MS)

    const statusResponse = await fetch(`${FIRECRAWL_AGENT_URL}/${jobId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15_000),
    })

    if (!statusResponse.ok) {
      console.error(`[firecrawl] agent poll failed: HTTP ${statusResponse.status}`)
      continue
    }

    const statusResult = (await statusResponse.json()) as FirecrawlAgentStatusResponse

    if (statusResult.status === 'completed') {
      const listings = statusResult.data?.jobListings ?? []
      const credits = statusResult.creditsUsed ?? 0
      console.info(`[firecrawl] agent completed: ${listings.length} listings (${credits} credits)`)
      return listings
    }

    if (statusResult.status === 'failed') {
      throw new Error(`[firecrawl] agent failed: ${statusResult.error ?? 'unknown error'}`)
    }

    // Still processing, continue polling
  }

  throw new Error(`[firecrawl] agent timed out after ${FIRECRAWL_AGENT_TIMEOUT_MS / 1000}s`)
}

export async function scrapeJobsWithFirecrawl(): Promise<RawJob[]> {
  const apiKey = cleanString(process.env.FIRECRAWL_API_KEY)
  if (!apiKey) return []

  const listings = await runFirecrawlAgent(apiKey)

  return extractFirecrawlJobsFromPayload({
    jobListings: listings,
  })
}

export async function scrapeAllBoards(): Promise<ScrapeAllBoardsResult> {
  const [firecrawlResult, legacyResult] = await Promise.allSettled([
    scrapeJobsWithFirecrawl(),
    scrapeLegacyBoards(),
  ])

  const errors: string[] = []

  const firecrawlJobs = firecrawlResult.status === 'fulfilled'
    ? firecrawlResult.value
    : (() => {
        const msg = firecrawlResult.reason instanceof Error
          ? firecrawlResult.reason.message
          : String(firecrawlResult.reason)
        console.error('[scraper] Firecrawl failed:', msg)
        errors.push(`firecrawl: ${msg}`)
        return [] as RawJob[]
      })()

  const legacyJobs = legacyResult.status === 'fulfilled'
    ? legacyResult.value
    : (() => {
        const msg = legacyResult.reason instanceof Error
          ? legacyResult.reason.message
          : String(legacyResult.reason)
        console.error('[scraper] Legacy boards failed:', msg)
        errors.push(`legacy: ${msg}`)
        return [] as RawJob[]
      })()

  // Firecrawl first so its richer metadata wins in dedup
  const combined = dedupeJobsByUrl([...firecrawlJobs, ...legacyJobs])

  const discoverySource = firecrawlJobs.length > 0 && legacyJobs.length > 0
    ? 'combined' as const
    : firecrawlJobs.length > 0
      ? 'firecrawl' as const
      : 'legacy' as const

  console.info(`[scraper] firecrawl: ${firecrawlJobs.length}, legacy: ${legacyJobs.length}, combined: ${combined.length}`)

  return {
    jobs: combined,
    discoverySource,
    firecrawlCount: firecrawlJobs.length,
    legacyCount: legacyJobs.length,
    errors,
  }
}

export interface FetchJobResult {
  description: string
  extractedSalary: ExtractedSalary | null
  httpStatus: number | null
}

export async function fetchJobDescription(url: string): Promise<FetchJobResult> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'LegalOpsCRM/1.0' },
      signal: AbortSignal.timeout(15_000),
    })

    if (!response.ok) return { description: '', extractedSalary: null, httpStatus: response.status }

    const html = await response.text()

    // Extract all structured metadata before stripping HTML
    const meta = extractJobMetaFromHtml(html)
    const metaBlock = buildMetadataBlock(meta)
    const text = stripHtml(html)

    const description = metaBlock
      ? `${metaBlock}\n\n${text}`.slice(0, 8_000)
      : text.slice(0, 8_000)

    return { description, extractedSalary: meta.salary, httpStatus: response.status }
  } catch {
    return { description: '', extractedSalary: null, httpStatus: null }
  }
}
