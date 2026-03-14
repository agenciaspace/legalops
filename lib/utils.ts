export function stripHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export interface ExtractedSalary {
  min: string | null
  max: string | null
  currency: string | null
  raw: string
}

/**
 * Extracts salary information from job page HTML using multiple strategies:
 * 1. Greenhouse pay_ranges JSON embedded in page state
 * 2. JSON-LD structured data (schema.org baseSalary)
 * 3. Lever salary data in page JSON
 * 4. Common salary patterns in visible text (e.g. "$120,000 - $180,000")
 */
export function extractSalaryFromHtml(html: string): ExtractedSalary | null {
  if (!html) return null

  // Strategy 1: Greenhouse pay_ranges JSON
  const greenhouse = extractGreenhousePayRanges(html)
  if (greenhouse) return greenhouse

  // Strategy 2: JSON-LD structured data (schema.org)
  const jsonLd = extractJsonLdSalary(html)
  if (jsonLd) return jsonLd

  // Strategy 3: Lever salary/compensation in page data
  const lever = extractLeverSalary(html)
  if (lever) return lever

  // Strategy 4: Common salary patterns in text
  const pattern = extractSalaryPattern(html)
  if (pattern) return pattern

  return null
}

function extractGreenhousePayRanges(html: string): ExtractedSalary | null {
  // Match pay_ranges JSON array in embedded page state
  const match = html.match(/"pay_ranges"\s*:\s*(\[[\s\S]*?\])\s*[,}]/)
  if (!match) return null

  try {
    const ranges = JSON.parse(match[1])
    if (!Array.isArray(ranges) || ranges.length === 0) return null

    const range = ranges[0]
    const min = typeof range.min === 'string' ? range.min : null
    const max = typeof range.max === 'string' ? range.max : null
    const currency = typeof range.currency_type === 'string' ? range.currency_type : null

    if (!min && !max) return null

    const parts = [min, max].filter(Boolean)
    const raw = currency ? `${parts.join(' - ')} ${currency}` : parts.join(' - ')

    return { min, max, currency, raw }
  } catch {
    return null
  }
}

function extractJsonLdSalary(html: string): ExtractedSalary | null {
  const scriptRegex = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let scriptMatch

  while ((scriptMatch = scriptRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(scriptMatch[1])
      const salary = data.baseSalary ?? data.estimatedSalary?.[0]
      if (!salary) continue

      const value = salary.value
      if (!value) continue

      const min = value.minValue != null ? String(value.minValue) : null
      const max = value.maxValue != null ? String(value.maxValue) : null
      const currency = salary.currency ?? null

      if (!min && !max) continue

      const parts = [min, max].filter(Boolean)
      const raw = currency ? `${parts.join(' - ')} ${currency}` : parts.join(' - ')

      return { min, max, currency, raw }
    } catch {
      continue
    }
  }

  return null
}

function extractLeverSalary(html: string): ExtractedSalary | null {
  // Lever embeds salary in posting data as salaryRange or compensation
  const salaryRangeMatch = html.match(/"salaryRange"\s*:\s*\{([^}]+)\}/)
  if (salaryRangeMatch) {
    try {
      const obj = JSON.parse(`{${salaryRangeMatch[1]}}`)
      const min = obj.min != null ? String(obj.min) : null
      const max = obj.max != null ? String(obj.max) : null
      const currency = obj.currency ?? null

      if (min || max) {
        const parts = [min, max].filter(Boolean)
        const raw = currency ? `${parts.join(' - ')} ${currency}` : parts.join(' - ')
        return { min, max, currency, raw }
      }
    } catch {
      // fall through
    }
  }

  // Lever also uses "additional" or "compensation" text
  const compensationMatch = html.match(/"compensation"\s*:\s*"([^"]+)"/)
  if (compensationMatch) {
    return { min: null, max: null, currency: null, raw: compensationMatch[1] }
  }

  return null
}

function extractSalaryPattern(html: string): ExtractedSalary | null {
  // Strip HTML tags first for clean text matching
  const text = html.replace(/<[^>]+>/g, ' ')

  // Match patterns like "$122,000 - $238,000", "R$5.000 - R$10.000", "€50,000-€80,000"
  const rangeRegex = /((?:R?\$|€|£)\s*[\d.,]+(?:k)?)\s*[-–—to]+\s*((?:R?\$|€|£)\s*[\d.,]+(?:k)?)\s*(USD|BRL|EUR|GBP)?/i
  const rangeMatch = text.match(rangeRegex)

  if (rangeMatch) {
    const min = rangeMatch[1].trim()
    const max = rangeMatch[2].trim()
    let currency = rangeMatch[3] ?? null

    if (!currency) {
      if (min.startsWith('R$')) currency = 'BRL'
      else if (min.startsWith('€')) currency = 'EUR'
      else if (min.startsWith('£')) currency = 'GBP'
      else if (min.startsWith('$')) currency = 'USD'
    }

    const raw = currency ? `${min} - ${max} ${currency}` : `${min} - ${max}`
    return { min, max, currency, raw }
  }

  // Match single salary like "$150,000 per year" or "R$15.000/mês"
  const singleRegex = /((?:R?\$|€|£)\s*[\d.,]+(?:k)?)\s*(?:per\s+(?:year|annum|month)|\/(?:yr|mo|year|month|ano|mês|mes)|(?:annual|annually|yearly|monthly|mensal))/i
  const singleMatch = text.match(singleRegex)

  if (singleMatch) {
    const amount = singleMatch[0].trim()
    let currency: string | null = null
    if (singleMatch[1].startsWith('R$')) currency = 'BRL'
    else if (singleMatch[1].startsWith('€')) currency = 'EUR'
    else if (singleMatch[1].startsWith('£')) currency = 'GBP'
    else if (singleMatch[1].startsWith('$')) currency = 'USD'

    return { min: singleMatch[1].trim(), max: null, currency, raw: amount }
  }

  return null
}

export const KEYWORDS = [
  'legal operations',
  'legal ops',
  'clm',
  'contract management',
  'head of legal',
  'operações jurídicas',
  'gestão de contratos',
]

export function matchesKeywords(text: string, keywords: string[] = KEYWORDS): boolean {
  const lower = text.toLowerCase()
  return keywords.some(kw => lower.includes(kw.toLowerCase()))
}
