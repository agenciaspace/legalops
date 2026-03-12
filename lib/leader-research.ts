import { stripHtml } from './utils'

export interface PublicSearchResult {
  title: string
  snippet: string
  url: string
  displayUrl: string | null
}

export interface SuggestedLeader {
  suggested_leader_name: string | null
  suggested_leader_title: string | null
  suggested_leader_linkedin: string | null
}

interface LeaderResearchParams {
  company: string
  jobTitle?: string | null
}

interface LeadershipPattern {
  canonicalTitle: string
  regex: RegExp
  baseScore: number
  opsBonus: number
}

const DUCKDUCKGO_HTML_URL = 'https://html.duckduckgo.com/html/'

const COMPANY_ALIASES: Record<string, string[]> = {
  ambev: ['Ambev'],
  bradesco: ['Bradesco', 'Banco Bradesco'],
  creditas: ['Creditas'],
  dock: ['Dock'],
  ebanx: ['EBANX'],
  embraer: ['Embraer'],
  greenhouse: ['Greenhouse'],
  gympass: ['Wellhub', 'Gympass'],
  ifood: ['iFood'],
  itau: ['Itau Unibanco', 'Itaú Unibanco'],
  jusbrasil: ['Jusbrasil'],
  'lalamove-brazil': ['Lalamove Brazil', 'Lalamove'],
  loft: ['Loft'],
  nubank: ['Nubank'],
  nuvemshop: ['Nuvemshop', 'Tiendanube'],
  pagarme: ['Pagar.me', 'Pagarme'],
  raizen: ['Raizen', 'Raízen'],
  stone: ['Stone'],
  totvs: ['TOTVS'],
  vtex: ['VTEX'],
}

const LEADERSHIP_PATTERNS: LeadershipPattern[] = [
  {
    canonicalTitle: 'Head of Legal Operations',
    regex: /\bhead of legal operations(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ&/.]+){0,4}\b/i,
    baseScore: 95,
    opsBonus: 30,
  },
  {
    canonicalTitle: 'Head of Legal Ops',
    regex: /\bhead of legal ops(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ&/.]+){0,4}\b/i,
    baseScore: 95,
    opsBonus: 30,
  },
  {
    canonicalTitle: 'Director of Legal Operations',
    regex: /\bdirector of legal operations(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ&/.]+){0,4}\b/i,
    baseScore: 90,
    opsBonus: 28,
  },
  {
    canonicalTitle: 'Legal Operations Director',
    regex: /\blegal operations director(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ&/.]+){0,4}\b/i,
    baseScore: 90,
    opsBonus: 28,
  },
  {
    canonicalTitle: 'Chief Legal Officer',
    regex: /\bchief legal officer\b/i,
    baseScore: 100,
    opsBonus: 12,
  },
  {
    canonicalTitle: 'Chief Legal and Compliance Officer',
    regex: /\bchief legal (?:and|&)\s+compliance officer\b/i,
    baseScore: 98,
    opsBonus: 12,
  },
  {
    canonicalTitle: 'General Counsel',
    regex: /\bgeneral counsel(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ&/.]+){0,4}\b/i,
    baseScore: 96,
    opsBonus: 10,
  },
  {
    canonicalTitle: 'Head of Legal',
    regex: /\bhead of legal(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ&/.]+){0,4}\b/i,
    baseScore: 94,
    opsBonus: 8,
  },
  {
    canonicalTitle: 'VP Legal',
    regex: /\b(?:vp legal|vice president(?: of)? legal)(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ&/.]+){0,4}\b/i,
    baseScore: 90,
    opsBonus: 6,
  },
  {
    canonicalTitle: 'Legal Director',
    regex: /\b(?:legal director|director,?\s+legal)(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ&/.]+){0,4}\b/i,
    baseScore: 88,
    opsBonus: 6,
  },
  {
    canonicalTitle: 'Associate General Counsel',
    regex: /\bassociate general counsel(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ&/.]+){0,4}\b/i,
    baseScore: 80,
    opsBonus: 4,
  },
]

const LOW_SIGNAL_HOSTS = [
  'apollo.io',
  'contactout.com',
  'rocketreach.co',
  'signalhire.com',
  'zoominfo.com',
]

const LOWERCASE_TITLE_WORDS = new Set(['and', 'for', 'in', 'of'])

function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .map((part, index) => {
      if (!part) return part
      if (index > 0 && LOWERCASE_TITLE_WORDS.has(part.toLowerCase())) return part.toLowerCase()
      if (part.toUpperCase() === part && part.length <= 5) return part
      return part[0].toUpperCase() + part.slice(1).toLowerCase()
    })
    .join(' ')
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function sanitizeLeadershipTitle(value: string): string {
  return value.split(/\s(?:\||-|•|–|—|@)\s/)[0].trim()
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
  }

function cleanSearchText(value: string): string {
  return stripHtml(decodeHtmlEntities(value)).replace(/\s+/g, ' ').trim()
}

function buildFallbackCompanyName(company: string): string {
  return company
    .split('-')
    .filter(Boolean)
    .map(token => {
      if (token.length <= 4) return token.toUpperCase()
      return token[0].toUpperCase() + token.slice(1)
    })
    .join(' ')
}

function getCompanyAliases(company: string): string[] {
  const configured = COMPANY_ALIASES[company] ?? []
  const fallback = buildFallbackCompanyName(company)
  const unique = new Set(
    [...configured, company.replace(/-/g, ' '), fallback].filter(Boolean)
  )
  return Array.from(unique)
}

function matchLeadershipPattern(text: string, isOpsRole: boolean) {
  for (const pattern of LEADERSHIP_PATTERNS) {
    const match = text.match(pattern.regex)
    if (!match) continue

    return {
      title: toTitleCase(sanitizeLeadershipTitle(match[0].trim())),
      score: pattern.baseScore + (isOpsRole ? pattern.opsBonus : 0),
      canonicalTitle: pattern.canonicalTitle,
    }
  }

  return null
}

function looksLikePersonName(segment: string, companyAliases: string[]): boolean {
  const trimmed = segment.trim()
  if (!trimmed) return false
  if (matchLeadershipPattern(trimmed, false)) return false

  const normalized = normalizeText(trimmed)
  if (companyAliases.some(alias => normalized.includes(normalizeText(alias)))) return false
  if (normalized.includes('linkedin')) return false

  const words = trimmed.split(/\s+/).filter(Boolean)
  if (words.length < 2 || words.length > 4) return false

  return words.every(word => /^[A-ZÀ-ÖØ-Þ][A-Za-zÀ-ÖØ-öø-ÿ'-]+$/.test(word))
}

function extractCandidateName(title: string, snippet: string, companyAliases: string[]): string | null {
  const titleSegments = title.split(/\s(?:\||-|•|–|—|@)\s/).map(part => part.trim())

  for (const segment of titleSegments) {
    if (looksLikePersonName(segment, companyAliases)) return segment
  }

  const snippetMatch = snippet.match(
    /\b([A-ZÀ-ÖØ-Þ][A-Za-zÀ-ÖØ-öø-ÿ'-]+(?:\s+[A-ZÀ-ÖØ-Þ][A-Za-zÀ-ÖØ-öø-ÿ'-]+){1,3})\b/
  )
  if (snippetMatch && looksLikePersonName(snippetMatch[1], companyAliases)) {
    return snippetMatch[1]
  }

  return null
}

function normalizeDuckDuckGoUrl(rawUrl: string): string {
  const absolute = rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl

  try {
    const url = new URL(absolute)
    const target = url.searchParams.get('uddg')
    return target ?? absolute
  } catch {
    return absolute
  }
}

function dedupeResults(results: PublicSearchResult[]): PublicSearchResult[] {
  const seen = new Set<string>()
  const deduped: PublicSearchResult[] = []

  for (const result of results) {
    try {
      const url = new URL(result.url)
      const key = `${url.hostname}${url.pathname}`.replace(/\/+$/, '')
      if (seen.has(key)) continue
      seen.add(key)
      deduped.push(result)
    } catch {
      if (seen.has(result.url)) continue
      seen.add(result.url)
      deduped.push(result)
    }
  }

  return deduped
}

export function buildLeaderSearchQueries(company: string): string[] {
  const [primaryName] = getCompanyAliases(company)

  return [
    `"${primaryName}" ("head of legal" OR "chief legal officer" OR "general counsel" OR "vp legal" OR "legal director")`,
    `"${primaryName}" ("head of legal operations" OR "head of legal ops" OR "director of legal operations" OR "legal operations director" OR "chief legal and compliance officer")`,
  ]
}

export function parseDuckDuckGoResults(html: string): PublicSearchResult[] {
  const blocks = html
    .split('<div class="result results_links')
    .slice(1)
    .map(block => `<div class="result results_links${block}`)

  return dedupeResults(
    blocks
      .map(block => {
        const anchorMatch = block.match(
          /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/
        )

        if (!anchorMatch) return null

        const snippetMatch = block.match(
          /<(?:a|div)[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/(?:a|div)>/
        )
        const displayUrlMatch = block.match(
          /<span class="result__url[^"]*"[^>]*>([\s\S]*?)<\/span>/
        )

        return {
          title: cleanSearchText(anchorMatch[2]),
          snippet: cleanSearchText(snippetMatch?.[1] ?? ''),
          url: normalizeDuckDuckGoUrl(decodeHtmlEntities(anchorMatch[1])),
          displayUrl: displayUrlMatch ? cleanSearchText(displayUrlMatch[1]) : null,
        } satisfies PublicSearchResult
      })
      .filter((result): result is PublicSearchResult => Boolean(result?.title && result?.url))
  )
}

async function searchDuckDuckGo(query: string, fetchImpl: typeof fetch): Promise<PublicSearchResult[]> {
  const url = new URL(DUCKDUCKGO_HTML_URL)
  url.searchParams.set('q', query)
  url.searchParams.set('kl', 'br-pt')

  const response = await fetchImpl(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; LegalOpsCRM/1.0)',
    },
    signal: AbortSignal.timeout(10000),
  })

  if (!response.ok) {
    throw new Error(`Search request failed with ${response.status}`)
  }

  const html = await response.text()
  return parseDuckDuckGoResults(html)
}

function scoreCompanyMatch(result: PublicSearchResult, companyAliases: string[]): number {
  const haystack = normalizeText(`${result.title} ${result.snippet} ${result.url}`)

  if (companyAliases.some(alias => haystack.includes(normalizeText(alias)))) {
    return 30
  }

  return 0
}

function scoreSourceQuality(result: PublicSearchResult): number {
  try {
    const url = new URL(result.url)
    const host = url.hostname.replace(/^www\./, '')

    if (host.includes('linkedin.com')) return 16
    if (LOW_SIGNAL_HOSTS.some(domain => host.includes(domain))) return -20
  } catch {
    return 0
  }

  return 6
}

function findLinkedInResultForName(results: PublicSearchResult[], name: string): string | null {
  const normalizedName = normalizeText(name)

  for (const result of results) {
    if (!result.url.includes('linkedin.com')) continue

    const haystack = normalizeText(`${result.title} ${result.snippet}`)
    if (haystack.includes(normalizedName)) {
      return result.url
    }
  }

  return null
}

export function selectLeaderFromSearchResults(
  results: PublicSearchResult[],
  params: LeaderResearchParams
): SuggestedLeader | null {
  const companyAliases = getCompanyAliases(params.company)
  const isOpsRole = /\blegal ops\b|\blegal operations\b|\bclm\b|\bcontract management\b/i.test(
    params.jobTitle ?? ''
  )

  const rankedCandidates = results
    .map(result => {
      const combinedText = `${result.title} ${result.snippet}`
      const titleMatch = matchLeadershipPattern(combinedText, isOpsRole)
      if (!titleMatch) return null

      const name = extractCandidateName(result.title, result.snippet, companyAliases)
      if (!name) return null

      const companyScore = scoreCompanyMatch(result, companyAliases)
      if (companyScore === 0) return null

      return {
        name,
        title: titleMatch.title || titleMatch.canonicalTitle,
        linkedinUrl: result.url.includes('linkedin.com') ? result.url : null,
        score: titleMatch.score + companyScore + scoreSourceQuality(result),
      }
    })
    .filter(
      (
        candidate
      ): candidate is {
        name: string
        title: string
        linkedinUrl: string | null
        score: number
      } => Boolean(candidate)
    )
    .sort((left, right) => right.score - left.score)

  const bestCandidate = rankedCandidates[0]
  if (!bestCandidate) return null

  return {
    suggested_leader_name: bestCandidate.name,
    suggested_leader_title: bestCandidate.title,
    suggested_leader_linkedin:
      bestCandidate.linkedinUrl ?? findLinkedInResultForName(results, bestCandidate.name),
  }
}

export async function researchSuggestedLeader(
  params: LeaderResearchParams,
  fetchImpl: typeof fetch = fetch
): Promise<SuggestedLeader | null> {
  const queries = buildLeaderSearchQueries(params.company)
  const results = await Promise.allSettled(
    queries.map(query => searchDuckDuckGo(query, fetchImpl))
  )

  const searchResults = dedupeResults(
    results.flatMap(result => (result.status === 'fulfilled' ? result.value : []))
  ).slice(0, 12)

  if (searchResults.length === 0) return null
  return selectLeaderFromSearchResults(searchResults, params)
}
