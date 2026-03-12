import { matchesKeywords, KEYWORDS } from './utils'

export type RawJob = {
  title: string
  url: string
  source_board: string
  company: string
}

export const COMPANY_SLUGS = {
  greenhouse: ['nubank', 'ifood', 'totvs', 'vtex', 'loft', 'gympass', 'creditas'],
  lever: ['stone', 'pagarme', 'dock', 'ebanx', 'nuvemshop'],
  workable: ['jusbrasil', 'lalamove-brazil'],
  gupy: ['itau', 'bradesco', 'ambev', 'embraer', 'raizen'],
} as const

export function filterByKeywords(jobs: { title: string; url: string }[]): typeof jobs {
  return jobs.filter(j => matchesKeywords(j.title, KEYWORDS))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseGreenhouseJobs(data: any, slug: string): RawJob[] {
  if (!data?.jobs) return []
  return data.jobs
    .map((j: { title: string; absolute_url: string }) => ({
      title: j.title,
      url: j.absolute_url,
      source_board: 'greenhouse',
      company: slug,
    }))
    .filter((j: RawJob) => matchesKeywords(j.title))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseLeverJobs(data: any[], slug: string): RawJob[] {
  if (!Array.isArray(data)) return []
  return data
    .map((j: { text: string; hostedUrl: string }) => ({
      title: j.text,
      url: j.hostedUrl,
      source_board: 'lever',
      company: slug,
    }))
    .filter((j: RawJob) => matchesKeywords(j.title))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseWorkableJobs(data: any, slug: string): RawJob[] {
  if (!data?.results) return []
  return data.results
    .map((j: { title: string; url: string }) => ({
      title: j.title,
      url: j.url,
      source_board: 'workable',
      company: slug,
    }))
    .filter((j: RawJob) => matchesKeywords(j.title))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseGupyJobs(data: any, slug: string): RawJob[] {
  if (!Array.isArray(data)) return []
  return data
    .map((j: { name: string; jobUrl: string }) => ({
      title: j.name,
      url: j.jobUrl,
      source_board: 'gupy',
      company: slug,
    }))
    .filter((j: RawJob) => matchesKeywords(j.title))
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'LegalOpsCRM/1.0' },
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

export async function scrapeAllBoards(): Promise<RawJob[]> {
  const results: RawJob[] = []

  for (const slug of COMPANY_SLUGS.greenhouse) {
    try {
      const data = await fetchJson(
        `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`
      )
      results.push(...parseGreenhouseJobs(data, slug))
    } catch (e) {
      console.error(`[scraper] greenhouse/${slug} failed:`, e)
    }
  }

  for (const slug of COMPANY_SLUGS.lever) {
    try {
      const data = await fetchJson(
        `https://api.lever.co/v0/postings/${slug}?mode=json`
      ) as unknown[]
      results.push(...parseLeverJobs(data, slug))
    } catch (e) {
      console.error(`[scraper] lever/${slug} failed:`, e)
    }
  }

  for (const slug of COMPANY_SLUGS.workable) {
    try {
      const data = await fetchJson(
        `https://${slug}.workable.com/api/v1/jobs`
      )
      results.push(...parseWorkableJobs(data, slug))
    } catch (e) {
      console.error(`[scraper] workable/${slug} failed:`, e)
    }
  }

  for (const slug of COMPANY_SLUGS.gupy) {
    try {
      const data = await fetchJson(
        `https://${slug}.gupy.io/api/job-openings`
      ) as unknown[]
      results.push(...parseGupyJobs(data, slug))
    } catch (e) {
      console.error(`[scraper] gupy/${slug} failed:`, e)
    }
  }

  return results
}

export async function fetchJobDescription(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'LegalOpsCRM/1.0' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return ''
    const html = await res.text()
    const { stripHtml } = await import('./utils')
    return stripHtml(html).slice(0, 8000)
  } catch {
    return ''
  }
}
