import { stripHtml, extractJobMetaFromHtml, buildMetadataBlock, type ExtractedSalary } from './utils'
import type { SourceBoard, UrlStatus } from './types'

export type RawJob = {
  title: string
  url: string
  source_board: SourceBoard
  company: string
  location?: string | null
  salary_range?: string | null
  listing_url?: string | null
  posted_at?: string | null
  accepts_brazil?: boolean
}

export type JobEligibility = {
  eligible: boolean
  reason: 'eligible' | 'location_not_supported' | 'brazil_eligibility_not_confirmed' | 'title_not_legal_ops'
}

export interface ScrapeAllBoardsResult {
  jobs: RawJob[]
  discoverySource: 'firecrawl' | 'legacy' | 'combined'
  firecrawlCount: number
  legacyCount: number
  firecrawlSucceeded: boolean
  legacySucceeded: boolean
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
  postedDate?: string
  postedDate_citation?: string
  acceptsBrazilCandidates?: boolean
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

export function buildFirecrawlAgentPrompt(now = new Date()): string {
  const today = now.toISOString().slice(0, 10)

  return `You curate the LegalOps Work jobs feed for Brazilian Legal Operations professionals. Today is ${today}.

Find job listings posted or updated in the last 30 days that are still accepting applications. Prioritize in this order:
1. Roles in Brazil, in Portuguese or English, whether remote, hybrid, or onsite.
2. LATAM roles that explicitly accept candidates based in Brazil.
3. Fully remote global roles that explicitly accept candidates in Brazil or LATAM.

Include roles whose primary work is Legal Operations, Legal Ops, operações jurídicas, operações legais, controladoria jurídica, Legal Project Management, Legal Process, Legal Innovation, Legal Technology/LegalTech, CLM or contract operations, legal spend/e-billing, legal data/BI/automation, or law department strategy and operations.

Exclude generic lawyer, attorney, counsel, General Counsel, Chief Legal Officer, Head of Legal, compliance, privacy, and paralegal roles unless the title itself clearly identifies Legal Operations work. Exclude internships, expired/closed listings, duplicates, and roles whose location rules exclude Brazil/LATAM.

Search public LinkedIn Jobs pages, Gupy, Indeed Brasil, company career sites, CLOC Jobs, Legal.io, LegalOperators, GoInhouse, Quero Home, and Radar da Gestão. Prefer the employer's or ATS's canonical application URL over an aggregator URL. Return the publication date as YYYY-MM-DD when available. Set acceptsBrazilCandidates to true only when the location is Brazil/LATAM or the listing explicitly accepts remote candidates based in Brazil/LATAM.`
}

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
          postedDate: {
            type: 'string',
            description: 'Publication or last update date in YYYY-MM-DD format, when available',
          },
          acceptsBrazilCandidates: {
            type: 'boolean',
            description: 'True only when candidates based in Brazil or LATAM are eligible for this role',
          },
          applicationLink: {
            type: 'string',
            description: 'Direct link to apply or view the full job posting',
          },
        },
        required: ['jobTitle', 'companyName', 'applicationLink', 'acceptsBrazilCandidates'],
      },
    },
  },
  required: ['jobListings'],
}

// Slugs verified live on 2026-08-14. Removed entries that returned HTTP 404
// (companies that migrated boards or changed slug). Re-audit periodically.
export const COMPANY_SLUGS = {
  greenhouse: [
    'nubank', 'vtex', 'gympass', 'stripe', 'cloudflare', 'databricks',
    'brex', 'verkada', 'harbor', 'airtable', 'figma',
  ],
  // Lever exposes a complete active-postings feed per company. Keep this list
  // deterministic and configurable instead of relying only on discovery AI.
  lever: ['hive'] as string[],
  workable: [] as string[],
  gupy: [] as string[],
} as const

export function getConfiguredBoardSlugs(board: keyof typeof COMPANY_SLUGS): string[] {
  const envName = `LEGALOPS_${board.toUpperCase()}_SLUGS`
  const configured = process.env[envName]
    ?.split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean)

  return configured && configured.length > 0 ? configured : [...COMPANY_SLUGS[board]]
}

function cleanString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const TRACKING_QUERY_PARAMS = new Set([
  'gh_src',
  'jobboardsource',
  'jobboardsourcename',
  'ref',
  'referrer',
  'refid',
  'source',
  'sourceid',
])

export function canonicalizeJobUrl(value: string): string {
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return value.trim()

    url.hash = ''
    for (const key of Array.from(url.searchParams.keys())) {
      const normalizedKey = key.toLowerCase()
      if (normalizedKey.startsWith('utm_') || TRACKING_QUERY_PARAMS.has(normalizedKey)) {
        url.searchParams.delete(key)
      }
    }

    if (url.pathname !== '/') {
      url.pathname = url.pathname.replace(/\/+$/, '')
    }

    const sortedParams = Array.from(url.searchParams.entries())
      .sort(([leftKey, leftValue], [rightKey, rightValue]) =>
        leftKey.localeCompare(rightKey) || leftValue.localeCompare(rightValue))
    url.search = ''
    for (const [key, paramValue] of sortedParams) {
      url.searchParams.append(key, paramValue)
    }

    return url.toString()
  } catch {
    return value.trim()
  }
}

function cleanUrl(value: unknown): string | null {
  const text = cleanString(value)
  if (!text) return null

  try {
    const url = new URL(text)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return canonicalizeJobUrl(text)
  } catch {
    return null
  }
}

function cleanPostedAt(value: unknown): string | null {
  const text = cleanString(value)
  if (!text || !/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(text)) return null

  const timestamp = Date.parse(text)
  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString()
}

function getFirstUrl(...values: unknown[]): string | null {
  for (const value of values) {
    const url = cleanUrl(value)
    if (url) return url
  }

  return null
}

export function matchesLegalOpsTitle(title: string): boolean {
  const normalized = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  return /\b(?:legal\s+(?:operations?|ops|operator|innovation|technology|tech|transformation)|operations?\s+(?:manager|director|lead|specialist|analyst|coordinator|supervisor),?\s+legal|contracts?\s*(?:&|and|e)\s*legal|legal\s+(?:project|process)|law\s+department\s+.*(?:operations?|strategy)|CLM\s+(?:manager|director|specialist|analyst|lead|consultant|coordinator)|operacoes?\s+(?:juridicas?|legais)|controladoria\s+juridica|inovacao\s+juridica|tecnologia\s+juridica|projetos?\s+juridicos?|legaltech)\b/i.test(normalized)
}

export function filterByKeywords(jobs: { title: string; url: string }[]): typeof jobs {
  return jobs.filter(job => matchesLegalOpsTitle(job.title))
}

export function matchesTargetMarket(location: string | null | undefined): boolean {
  if (!location) return false

  const normalized = location
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  return /\b(?:brazil|brasil|latam|latin america|south america|sao paulo|rio de janeiro|belo horizonte|brasilia|curitiba|porto alegre|florianopolis|recife|salvador|fortaleza|goiania|campinas|manaus|sp|rj|mg|df|pr|rs|sc|pe|ba|ce|go|am)\b/.test(normalized)
}

export function evaluateJobEligibility(job: {
  title: string
  location?: string | null
  accepts_brazil?: boolean
}): JobEligibility {
  if (!matchesLegalOpsTitle(job.title)) {
    return { eligible: false, reason: 'title_not_legal_ops' }
  }

  if (job.accepts_brazil === true || matchesTargetMarket(job.location)) {
    return { eligible: true, reason: 'eligible' }
  }

  return {
    eligible: false,
    reason: job.location ? 'location_not_supported' : 'brazil_eligibility_not_confirmed',
  }
}

export function extractStoredLocation(rawDescription: string | null | undefined): string | null {
  if (!rawDescription) return null
  const match = rawDescription.match(/^LOCATION:\s*(.+)$/im)
  return match?.[1]?.trim() || null
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
    listing.postedDate_citation,
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
    posted_at: cleanPostedAt(listing.postedDate),
    accepts_brazil: listing.acceptsBrazilCandidates === true,
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
      .filter((job): job is RawJob =>
        job !== null && (matchesTargetMarket(job.location) || job.accepts_brazil === true))
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

  if (job.posted_at) {
    lines.push(`Posted at: ${job.posted_at}`)
  }

  lines.push(`Application link: ${job.url}`)

  return lines.join('\n')
}

export function dedupeJobsByUrl(jobs: RawJob[]): RawJob[] {
  const seen = new Map<string, RawJob>()

  for (const job of jobs) {
    const canonicalUrl = canonicalizeJobUrl(job.url)
    const key = canonicalUrl.toLowerCase()
    if (!seen.has(key)) {
      seen.set(key, {
        ...job,
        url: canonicalUrl,
        listing_url: job.listing_url ? canonicalizeJobUrl(job.listing_url) : job.listing_url,
      })
    }
  }

  return Array.from(seen.values())
}

export const STALE_JOB_AFTER_DAYS = 45

export interface ExistingJobFreshness {
  url: string
  created_at: string
  posted_at: string | null
  url_checked_at: string | null
}

export function shouldExpireUnseenJob(
  job: ExistingJobFreshness,
  discoveredUrls: ReadonlySet<string>,
  now = new Date(),
): boolean {
  const canonicalUrl = canonicalizeJobUrl(job.url).toLowerCase()
  if (discoveredUrls.has(canonicalUrl)) return false

  const cutoff = now.getTime() - STALE_JOB_AFTER_DAYS * 24 * 60 * 60 * 1000
  const freshnessSignals = [job.created_at, job.posted_at, job.url_checked_at]
    .filter((value): value is string => Boolean(value))
    .map(value => Date.parse(value))
    .filter(value => !Number.isNaN(value))

  return freshnessSignals.length > 0 && Math.max(...freshnessSignals) < cutoff
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

const LEGACY_CONCURRENCY = 4
const FETCH_RETRY_ATTEMPTS = 2
const FETCH_RETRY_BASE_MS = 500

async function fetchJsonOnce(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'LegalOpsCRM/1.0' },
    signal: AbortSignal.timeout(10_000),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`)
  }

  return response.json()
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchJson(url: string): Promise<unknown> {
  let lastError: unknown

  for (let attempt = 0; attempt < FETCH_RETRY_ATTEMPTS; attempt++) {
    try {
      return await fetchJsonOnce(url)
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

  const workerCount = Math.min(Math.max(1, Math.floor(concurrency)), items.length)
  await Promise.all(Array.from({ length: workerCount }, () => worker()))
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
    ...getConfiguredBoardSlugs('greenhouse').map(slug => ({
      board: 'greenhouse',
      slug,
      url: `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`,
      parse: parseGreenhouseJobs,
    })),
    ...getConfiguredBoardSlugs('lever').map(slug => ({
      board: 'lever',
      slug,
      url: `https://api.lever.co/v0/postings/${slug}?mode=json`,
      parse: parseLeverJobs,
    })),
    ...getConfiguredBoardSlugs('workable').map(slug => ({
      board: 'workable',
      slug,
      url: `https://${slug}.workable.com/api/v1/jobs`,
      parse: parseWorkableJobs,
    })),
    ...getConfiguredBoardSlugs('gupy').map(slug => ({
      board: 'gupy',
      slug,
      url: `https://${slug}.gupy.io/api/job-openings`,
      parse: parseGupyJobs,
    })),
  ]

  const settled = await mapWithConcurrency(tasks, LEGACY_CONCURRENCY, async task => {
    const data = await fetchJson(task.url)
    return task.parse(data, task.slug)
  })

  const results: RawJob[] = []
  for (let index = 0; index < settled.length; index++) {
    const result = settled[index]
    if (result.status === 'fulfilled') {
      results.push(...result.value)
    } else {
      console.error(`[scraper] ${tasks[index].board}/${tasks[index].slug} failed:`, result.reason)
    }
  }

  // Legacy ATS APIs expose no reliable candidate eligibility field. Keep only
  // explicit Brazil/LATAM locations; Firecrawl handles global remote roles
  // after verifying they accept candidates based in this market.
  return dedupeJobsByUrl(results.filter(job => matchesTargetMarket(job.location)))
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
      prompt: buildFirecrawlAgentPrompt(),
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
  if (!apiKey) {
    // Throw so Promise.allSettled in scrapeAllBoards surfaces it in errors[],
    // instead of silently degrading to legacy-only and hiding the misconfig.
    throw new Error('FIRECRAWL_API_KEY is missing or empty')
  }

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
    firecrawlSucceeded: firecrawlResult.status === 'fulfilled',
    legacySucceeded: legacyResult.status === 'fulfilled',
    errors,
  }
}

export interface FetchJobResult {
  description: string
  extractedSalary: ExtractedSalary | null
  httpStatus: number | null
  urlStatus: UrlStatus
}

const CLOSED_JOB_PAGE_SIGNALS = [
  'this job is no longer available',
  'this role is no longer available',
  'this position is no longer available',
  'this job is no longer open',
  'the job you are looking for is no longer open',
  'no longer accepting applications',
  'this job has expired',
  'this job posting has expired',
  'this position has been filled',
  'job posting not found',
  'job not found',
  'esta vaga não está mais disponível',
  'esta vaga nao esta mais disponivel',
  'não está mais aceitando candidaturas',
  'nao esta mais aceitando candidaturas',
  'processo seletivo encerrado',
  'vaga encerrada',
  'vaga não encontrada',
  'vaga nao encontrada',
] as const

/**
 * A crawler result is only considered live after the application page itself
 * responds successfully and does not contain an explicit closure message.
 * Network failures remain unknown so a temporary provider outage is not
 * mistaken for a closed role.
 */
export function classifyJobUrlStatus(
  httpStatus: number | null,
  pageHtml = '',
  responseUrl = '',
): UrlStatus {
  if (httpStatus === null) return 'unknown'
  if (httpStatus === 404 || httpStatus === 410) return 'dead'
  if (httpStatus < 200 || httpStatus >= 300) return 'unknown'

  if (responseUrl) {
    try {
      const resolvedUrl = new URL(responseUrl)
      const genericDestination = /^\/(?:careers?|jobs?)\/?$/i.test(resolvedUrl.pathname)
      if (resolvedUrl.searchParams.get('error') === 'true' || genericDestination) return 'dead'
    } catch {
      return 'unknown'
    }
  }

  const normalizedPage = pageHtml.toLocaleLowerCase('en-US')
  return CLOSED_JOB_PAGE_SIGNALS.some(signal => normalizedPage.includes(signal))
    ? 'dead'
    : 'live'
}

export async function fetchJobDescription(url: string): Promise<FetchJobResult> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'LegalOpsCRM/1.0' },
      signal: AbortSignal.timeout(15_000),
    })

    if (!response.ok) {
      return {
        description: '',
        extractedSalary: null,
        httpStatus: response.status,
        urlStatus: classifyJobUrlStatus(response.status),
      }
    }

    const html = await response.text()
    const urlStatus = classifyJobUrlStatus(response.status, html, response.url)

    if (urlStatus === 'dead') {
      return { description: '', extractedSalary: null, httpStatus: response.status, urlStatus }
    }

    // Extract all structured metadata before stripping HTML
    const meta = extractJobMetaFromHtml(html)
    const metaBlock = buildMetadataBlock(meta)
    const text = stripHtml(html)

    const description = metaBlock
      ? `${metaBlock}\n\n${text}`.slice(0, 8_000)
      : text.slice(0, 8_000)

    return { description, extractedSalary: meta.salary, httpStatus: response.status, urlStatus }
  } catch {
    return { description: '', extractedSalary: null, httpStatus: null, urlStatus: 'unknown' }
  }
}
