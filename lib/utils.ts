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
  period: string | null
  raw: string
}

export interface ExtractedJobMeta {
  salary: ExtractedSalary | null
  location: string | null
  remote_status: string | null
  employment_type: string | null
  benefits: string[]
  posted_at: string | null
  department: string | null
}

/**
 * Extracts ALL possible structured metadata from job page HTML:
 * - Salary from structured JSON (Greenhouse, Lever, Gupy, Workable, JSON-LD)
 * - Salary from text patterns (multiple currencies, k notation, hourly, OTE, etc.)
 * - Location, remote status, employment type, benefits, posting date
 */
export function extractJobMetaFromHtml(html: string): ExtractedJobMeta {
  if (!html) return emptyJobMeta()

  const salary = extractSalaryFromHtml(html)
  const jsonLdMeta = extractJsonLdMeta(html)
  const embeddedMeta = extractEmbeddedJsonMeta(html)
  const textMeta = extractTextMeta(html)

  return {
    salary,
    location: jsonLdMeta.location ?? embeddedMeta.location ?? textMeta.location,
    remote_status: embeddedMeta.remote_status ?? textMeta.remote_status,
    employment_type: jsonLdMeta.employment_type ?? embeddedMeta.employment_type ?? textMeta.employment_type,
    benefits: [...new Set([...embeddedMeta.benefits, ...textMeta.benefits])],
    posted_at: jsonLdMeta.posted_at ?? embeddedMeta.posted_at,
    department: embeddedMeta.department ?? textMeta.department,
  }
}

function emptyJobMeta(): ExtractedJobMeta {
  return { salary: null, location: null, remote_status: null, employment_type: null, benefits: [], posted_at: null, department: null }
}

// ─── Salary extraction (kept backwards-compatible) ───

export function extractSalaryFromHtml(html: string): ExtractedSalary | null {
  if (!html) return null

  // Structured data first (most reliable)
  const greenhouse = extractGreenhousePayRanges(html)
  if (greenhouse) return greenhouse

  const jsonLd = extractJsonLdSalary(html)
  if (jsonLd) return jsonLd

  const lever = extractLeverSalary(html)
  if (lever) return lever

  const gupy = extractGupySalary(html)
  if (gupy) return gupy

  const workable = extractWorkableSalary(html)
  if (workable) return workable

  // Generic embedded JSON salary patterns
  const genericJson = extractGenericJsonSalary(html)
  if (genericJson) return genericJson

  // Text patterns as fallback
  const pattern = extractSalaryPattern(html)
  if (pattern) return pattern

  return null
}

// ─── Structured salary extractors ───

function extractGreenhousePayRanges(html: string): ExtractedSalary | null {
  const match = html.match(/"pay_ranges"\s*:\s*(\[[\s\S]*?\])\s*[,}]/)
  if (!match) return null

  try {
    const ranges = JSON.parse(match[1])
    if (!Array.isArray(ranges) || ranges.length === 0) return null

    const range = ranges[0]
    const min = typeof range.min === 'string' ? range.min : null
    const max = typeof range.max === 'string' ? range.max : null
    const currency = typeof range.currency_type === 'string' ? range.currency_type : null
    const title = typeof range.title === 'string' ? range.title : null
    const period = title?.toLowerCase().includes('annual') ? 'year'
      : title?.toLowerCase().includes('month') ? 'month'
      : title?.toLowerCase().includes('hour') ? 'hour'
      : null

    if (!min && !max) return null

    const parts = [min, max].filter(Boolean)
    const raw = currency ? `${parts.join(' - ')} ${currency}` : parts.join(' - ')
    return { min, max, currency, period, raw }
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
      // Handle @graph arrays
      const posting = data['@type'] === 'JobPosting' ? data
        : Array.isArray(data['@graph']) ? data['@graph'].find((n: Record<string, unknown>) => n['@type'] === 'JobPosting')
        : null
      if (!posting) continue

      const salary = posting.baseSalary ?? posting.estimatedSalary?.[0]
      if (!salary) continue

      const value = salary.value ?? salary
      const min = value.minValue != null ? String(value.minValue) : (value.value != null ? String(value.value) : null)
      const max = value.maxValue != null ? String(value.maxValue) : null
      const currency = salary.currency ?? null
      const unitText = value.unitText ?? salary.unitText ?? null
      const period = unitText === 'YEAR' ? 'year'
        : unitText === 'MONTH' ? 'month'
        : unitText === 'HOUR' ? 'hour'
        : null

      if (!min && !max) continue

      const parts = [min, max].filter(Boolean)
      let raw = currency ? `${parts.join(' - ')} ${currency}` : parts.join(' - ')
      if (period) raw += ` per ${period}`
      return { min, max, currency, period, raw }
    } catch {
      continue
    }
  }

  return null
}

function extractLeverSalary(html: string): ExtractedSalary | null {
  const salaryRangeMatch = html.match(/"salaryRange"\s*:\s*\{([^}]+)\}/)
  if (salaryRangeMatch) {
    try {
      const obj = JSON.parse(`{${salaryRangeMatch[1]}}`)
      const min = obj.min != null ? String(obj.min) : null
      const max = obj.max != null ? String(obj.max) : null
      const currency = obj.currency ?? null
      const interval = obj.interval ?? null
      const period = interval === 'per-year-salary' ? 'year' : interval === 'per-month-salary' ? 'month' : null

      if (min || max) {
        const parts = [min, max].filter(Boolean)
        const raw = currency ? `${parts.join(' - ')} ${currency}` : parts.join(' - ')
        return { min, max, currency, period, raw }
      }
    } catch {
      // fall through
    }
  }

  // Lever "additional" or "compensation" text field
  const compensationMatch = html.match(/"compensation"\s*:\s*"([^"]+)"/)
  if (compensationMatch) {
    return { min: null, max: null, currency: null, period: null, raw: compensationMatch[1] }
  }

  return null
}

function extractGupySalary(html: string): ExtractedSalary | null {
  // Gupy embeds salary in job data as salaryFrom/salaryTo or faixaSalarial
  const salaryFromMatch = html.match(/"salaryFrom"\s*:\s*(\d+(?:\.\d+)?)/)
  const salaryToMatch = html.match(/"salaryTo"\s*:\s*(\d+(?:\.\d+)?)/)

  if (salaryFromMatch || salaryToMatch) {
    const min = salaryFromMatch ? salaryFromMatch[1] : null
    const max = salaryToMatch ? salaryToMatch[1] : null
    if (!min && !max) return null
    const parts = [min, max].filter(Boolean)
    return { min, max, currency: 'BRL', period: 'month', raw: `R$${parts.join(' - R$')} BRL` }
  }

  // Gupy "faixaSalarial" text
  const faixaMatch = html.match(/"faixaSalarial"\s*:\s*"([^"]+)"/)
  if (faixaMatch) {
    return { min: null, max: null, currency: 'BRL', period: null, raw: faixaMatch[1] }
  }

  return null
}

function extractWorkableSalary(html: string): ExtractedSalary | null {
  // Workable uses salary object in page data
  const salaryMatch = html.match(/"salary"\s*:\s*\{([^}]+)\}/)
  if (!salaryMatch) return null

  try {
    const obj = JSON.parse(`{${salaryMatch[1]}}`)
    const min = obj.salary_from != null ? String(obj.salary_from) : (obj.min != null ? String(obj.min) : null)
    const max = obj.salary_to != null ? String(obj.salary_to) : (obj.max != null ? String(obj.max) : null)
    const currency = obj.currency ?? null
    const period = obj.period ?? null

    if (!min && !max) return null

    const parts = [min, max].filter(Boolean)
    const raw = currency ? `${parts.join(' - ')} ${currency}` : parts.join(' - ')
    return { min, max, currency, period, raw }
  } catch {
    return null
  }
}

function extractGenericJsonSalary(html: string): ExtractedSalary | null {
  // Catch generic JSON patterns: "salary_min"/"salary_max", "minSalary"/"maxSalary",
  // "compensation_min"/"compensation_max", "pay_min"/"pay_max"
  const patterns = [
    { min: /"(?:salary_min|minSalary|pay_min|compensation_min|salaryMin)"\s*:\s*(\d+(?:\.\d+)?)/, max: /"(?:salary_max|maxSalary|pay_max|compensation_max|salaryMax)"\s*:\s*(\d+(?:\.\d+)?)/ },
    { min: /"(?:salary_range_min|salary_lower|base_min)"\s*:\s*(\d+(?:\.\d+)?)/, max: /"(?:salary_range_max|salary_upper|base_max)"\s*:\s*(\d+(?:\.\d+)?)/ },
  ]

  for (const pat of patterns) {
    const minMatch = html.match(pat.min)
    const maxMatch = html.match(pat.max)
    if (minMatch || maxMatch) {
      const min = minMatch ? minMatch[1] : null
      const max = maxMatch ? maxMatch[1] : null
      if (!min && !max) continue

      // Try to find nearby currency
      const currencyMatch = html.match(/"(?:salary_currency|currency|salaryCurrency)"\s*:\s*"([A-Z]{3})"/)
      const currency = currencyMatch ? currencyMatch[1] : null

      const parts = [min, max].filter(Boolean)
      const raw = currency ? `${parts.join(' - ')} ${currency}` : parts.join(' - ')
      return { min, max, currency, period: null, raw }
    }
  }

  return null
}

// ─── Text-based salary patterns ───

const CURRENCY_SYMBOLS: Record<string, string> = {
  'R$': 'BRL', '$': 'USD', '€': 'EUR', '£': 'GBP',
  '₹': 'INR', '¥': 'JPY', 'CHF': 'CHF', 'A$': 'AUD',
  'C$': 'CAD', 'S$': 'SGD', 'HK$': 'HKD', 'NZ$': 'NZD',
  'kr': 'SEK', 'zł': 'PLN', '₪': 'ILS',
}

const CURRENCY_CODES = 'USD|BRL|EUR|GBP|INR|JPY|CHF|AUD|CAD|SGD|HKD|NZD|SEK|PLN|ILS|MXN|CLP|COP|ARS|PEN'

function inferCurrencyFromSymbol(text: string): string | null {
  // Check from longest to shortest to avoid partial matches
  const sorted = Object.keys(CURRENCY_SYMBOLS).sort((a, b) => b.length - a.length)
  for (const sym of sorted) {
    if (text.startsWith(sym)) return CURRENCY_SYMBOLS[sym]
  }
  return null
}

function extractSalaryPattern(html: string): ExtractedSalary | null {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ')

  // Pattern 1: Currency symbol ranges — "$122,000 - $238,000", "R$5.000 - R$10.000", "€50k-€80k"
  const symbolRange = /((?:R\$|A\$|C\$|S\$|HK\$|NZ\$|\$|€|£|₹|¥|₪|zł|kr|CHF)\s*[\d.,]+\s*(?:k|K|mil)?)\s*[-–—]\s*((?:R\$|A\$|C\$|S\$|HK\$|NZ\$|\$|€|£|₹|¥|₪|zł|kr|CHF)\s*[\d.,]+\s*(?:k|K|mil)?)\s*(?:(${CURRENCY_CODES})\b)?/i
  const symbolMatch = text.match(symbolRange)
  if (symbolMatch) {
    return buildRangeResult(symbolMatch[1].trim(), symbolMatch[2].trim(), symbolMatch[3] ?? null)
  }

  // Pattern 2: "to" / "a" separator — "$95,000 to $130,000", "R$8.000 a R$15.000"
  const toRange = /((?:R\$|A\$|C\$|S\$|HK\$|NZ\$|\$|€|£|₹|¥|₪|zł|kr|CHF)\s*[\d.,]+\s*(?:k|K|mil)?)\s+(?:to|a|até|bis|~)\s+((?:R\$|A\$|C\$|S\$|HK\$|NZ\$|\$|€|£|₹|¥|₪|zł|kr|CHF)\s*[\d.,]+\s*(?:k|K|mil)?)\s*(?:(${CURRENCY_CODES})\b)?/i
  const toMatch = text.match(toRange)
  if (toMatch) {
    return buildRangeResult(toMatch[1].trim(), toMatch[2].trim(), toMatch[3] ?? null)
  }

  // Pattern 3: Numeric range with currency code — "120,000 - 180,000 USD", "8.000 - 15.000 BRL"
  const numericRange = new RegExp(
    `(\\d[\\d.,]*\\s*(?:k|K|mil)?)\\s*[-–—]\\s*(\\d[\\d.,]*\\s*(?:k|K|mil)?)\\s*(${CURRENCY_CODES})\\b`,
    'i'
  )
  const numericMatch = text.match(numericRange)
  if (numericMatch) {
    return { min: numericMatch[1].trim(), max: numericMatch[2].trim(), currency: numericMatch[3].toUpperCase(), period: null, raw: `${numericMatch[1].trim()} - ${numericMatch[2].trim()} ${numericMatch[3].toUpperCase()}` }
  }

  // Pattern 4: Labeled ranges — "Salary: $120k - $180k", "Remuneração: R$8.000 a R$15.000"
  // "Compensation: 120,000-180,000", "OTE: $200k - $280k", "Base: $150,000 - $200,000"
  const labeledRange = /(?:salary|salário|salario|remuneração|remuneracao|compensation|compensação|compensacao|base\s*(?:salary|pay)|ote|ctc|pay|faixa\s*salarial|vencimento)\s*(?:range)?[:\s]+\s*((?:R\$|A\$|C\$|S\$|HK\$|NZ\$|\$|€|£|₹|¥|₪|zł|kr|CHF)?\s*[\d.,]+\s*(?:k|K|mil)?)\s*[-–—]\s*((?:R\$|A\$|C\$|S\$|HK\$|NZ\$|\$|€|£|₹|¥|₪|zł|kr|CHF)?\s*[\d.,]+\s*(?:k|K|mil)?)\s*(?:(${CURRENCY_CODES})\b)?/i
  const labeledMatch = text.match(labeledRange)
  if (labeledMatch) {
    return buildRangeResult(labeledMatch[1].trim(), labeledMatch[2].trim(), labeledMatch[3] ?? null)
  }

  // Pattern 5: Currency symbol + amount + period — "$150,000 per year", "R$15.000/mês", "£45k annually"
  // (must run before labeled single to capture period info)
  const singlePeriod = /((?:R\$|A\$|C\$|S\$|HK\$|NZ\$|\$|€|£|₹|¥|₪|zł|kr|CHF)\s*[\d.,]+\s*(?:k|K|mil)?)\s*(?:per\s+(?:year|annum|month|hour|yr|mo|hr|ano|mês|mes|hora)|\/(?:yr|mo|year|month|hour|hr|ano|mês|mes|hora)|(?:annual(?:ly)?|yearly|monthly|mensal|hourly|p\.?a\.?|p\.?m\.?))\b/i
  const singlePeriodMatch = text.match(singlePeriod)
  if (singlePeriodMatch) {
    const val = singlePeriodMatch[1].trim()
    const currency = inferCurrencyFromSymbol(val)
    const periodText = singlePeriodMatch[0].toLowerCase()
    const period = /hour|hr|hora|hourly/.test(periodText) ? 'hour'
      : /month|mo|mês|mes|mensal|p\.?m\.?/.test(periodText) ? 'month'
      : 'year'
    return { min: val, max: null, currency, period, raw: singlePeriodMatch[0].trim() }
  }

  // Pattern 6: "Salary: $150,000" or "Remuneração: R$12.000" (single value with label, no period)
  const labeledSingle = new RegExp(
    `(?:salary|salário|salario|remuneração|remuneracao|compensation|compensação|compensacao|base\\s*(?:salary|pay)|ote|ctc|pay|faixa\\s*salarial|vencimento)\\s*(?:range)?[:\\s]+\\s*((?:R\\$|A\\$|C\\$|S\\$|HK\\$|NZ\\$|\\$|€|£|₹|¥|₪|zł|kr|CHF)\\s*[\\d.,]+\\s*(?:k|K|mil)?)\\s*(?:(${CURRENCY_CODES})\\b)?`,
    'i'
  )
  const labeledSingleMatch = text.match(labeledSingle)
  if (labeledSingleMatch) {
    const val = labeledSingleMatch[1].trim()
    const currency = labeledSingleMatch[2]?.toUpperCase() ?? inferCurrencyFromSymbol(val)
    return { min: val, max: null, currency, period: null, raw: currency ? `${val} ${currency}` : val }
  }

  // Pattern 7: Numeric range near salary keyword (within 50 chars) — "Salary ... 120k-180k"
  const nearSalaryKeyword = /(?:salary|salário|remuneração|compensation|pay|ote|ctc|faixa)[^.]{0,50}?([\d.,]+\s*(?:k|K|mil)?)\s*[-–—]\s*([\d.,]+\s*(?:k|K|mil)?)/i
  const nearMatch = text.match(nearSalaryKeyword)
  if (nearMatch) {
    const min = nearMatch[1].trim()
    const max = nearMatch[2].trim()
    return { min, max, currency: null, period: null, raw: `${min} - ${max}` }
  }

  return null
}

function buildRangeResult(min: string, max: string, currencyCode: string | null): ExtractedSalary {
  const currency = currencyCode?.toUpperCase() ?? inferCurrencyFromSymbol(min) ?? inferCurrencyFromSymbol(max)
  const raw = currency ? `${min} - ${max} ${currency}` : `${min} - ${max}`
  return { min, max, currency, period: null, raw }
}

// ─── JSON-LD metadata extraction (beyond salary) ───

interface JsonLdMeta { location: string | null; employment_type: string | null; posted_at: string | null }

function extractJsonLdMeta(html: string): JsonLdMeta {
  const result: JsonLdMeta = { location: null, employment_type: null, posted_at: null }
  const scriptRegex = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let scriptMatch

  while ((scriptMatch = scriptRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(scriptMatch[1])
      const posting = data['@type'] === 'JobPosting' ? data
        : Array.isArray(data['@graph']) ? data['@graph'].find((n: Record<string, unknown>) => n['@type'] === 'JobPosting')
        : null
      if (!posting) continue

      if (!result.location && posting.jobLocation) {
        const loc = posting.jobLocation
        if (typeof loc === 'string') {
          result.location = loc
        } else if (loc.address) {
          const addr = loc.address
          const parts = [addr.addressLocality, addr.addressRegion, addr.addressCountry].filter(Boolean)
          if (parts.length > 0) result.location = parts.join(', ')
        } else if (loc.name) {
          result.location = loc.name
        }
      }

      if (!result.employment_type && posting.employmentType) {
        result.employment_type = Array.isArray(posting.employmentType)
          ? posting.employmentType.join(', ')
          : String(posting.employmentType)
      }

      if (!result.posted_at && posting.datePosted) {
        result.posted_at = posting.datePosted
      }
    } catch {
      continue
    }
  }

  return result
}

// ─── Embedded JSON metadata (Greenhouse, Lever, Gupy, Workable page state) ───

interface EmbeddedMeta { location: string | null; remote_status: string | null; employment_type: string | null; benefits: string[]; posted_at: string | null; department: string | null }

function extractEmbeddedJsonMeta(html: string): EmbeddedMeta {
  const result: EmbeddedMeta = { location: null, remote_status: null, employment_type: null, benefits: [], posted_at: null, department: null }

  // Location patterns
  const locationPatterns = [
    /"location"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/,
    /"location_name"\s*:\s*"([^"]+)"/,
    /"locationName"\s*:\s*"([^"]+)"/,
    /"city"\s*:\s*"([^"]+)"/,
    /"office_location"\s*:\s*"([^"]+)"/,
  ]
  for (const pat of locationPatterns) {
    const m = html.match(pat)
    if (m) { result.location = m[1]; break }
  }

  // Remote status
  const remotePatterns = [
    /"(?:is_remote|isRemote|remote)"\s*:\s*(true|false|"[^"]*")/,
    /"work_type"\s*:\s*"([^"]+)"/,
    /"workplaceType"\s*:\s*"([^"]+)"/,
    /"jobLocationType"\s*:\s*"([^"]+)"/,
  ]
  for (const pat of remotePatterns) {
    const m = html.match(pat)
    if (m) { result.remote_status = m[1].replace(/"/g, ''); break }
  }

  // Employment type
  const typePatterns = [
    /"employment_type"\s*:\s*"([^"]+)"/,
    /"employmentType"\s*:\s*"([^"]+)"/,
    /"type"\s*:\s*"(full[_-]?time|part[_-]?time|contract|temporary|intern(?:ship)?|freelance)"/i,
  ]
  for (const pat of typePatterns) {
    const m = html.match(pat)
    if (m) { result.employment_type = m[1]; break }
  }

  // Benefits (array in JSON)
  const benefitsMatch = html.match(/"benefits"\s*:\s*(\[[^\]]*\])/)
  if (benefitsMatch) {
    try {
      const arr = JSON.parse(benefitsMatch[1])
      if (Array.isArray(arr)) {
        result.benefits = arr
          .map((b: unknown) => typeof b === 'string' ? b : (b && typeof b === 'object' && 'name' in b) ? String((b as { name: string }).name) : null)
          .filter((b): b is string => b !== null)
      }
    } catch { /* ignore */ }
  }

  // Posted date
  const datePatterns = [
    /"(?:posted_at|postedAt|date_posted|datePosted|published_at|publishedAt|created_at|createdAt)"\s*:\s*"([^"]+)"/,
  ]
  for (const pat of datePatterns) {
    const m = html.match(pat)
    if (m) { result.posted_at = m[1]; break }
  }

  // Department
  const deptPatterns = [
    /"department(?:_name|Name)?"\s*:\s*"([^"]+)"/,
    /"team(?:_name|Name)?"\s*:\s*"([^"]+)"/,
  ]
  for (const pat of deptPatterns) {
    const m = html.match(pat)
    if (m) { result.department = m[1]; break }
  }

  return result
}

// ─── Text-based metadata extraction ───

interface TextMeta { location: string | null; remote_status: string | null; employment_type: string | null; benefits: string[]; department: string | null }

function extractTextMeta(html: string): TextMeta {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  const result: TextMeta = { location: null, remote_status: null, employment_type: null, benefits: [], department: null }

  // Remote keywords
  if (/\b(?:fully\s+remote|100%\s*remote|work\s+from\s+(?:home|anywhere)|remoto|trabalho\s+remoto)\b/i.test(text)) {
    result.remote_status = 'remote'
  } else if (/\b(?:hybrid|híbrido|hibrido)\b/i.test(text)) {
    result.remote_status = 'hybrid'
  } else if (/\b(?:on[- ]?site|presencial|in[- ]?office)\b/i.test(text)) {
    result.remote_status = 'onsite'
  }

  // Employment type
  if (/\b(?:full[- ]?time|tempo\s+integral|CLT|efetivo)\b/i.test(text)) {
    result.employment_type = 'full-time'
  } else if (/\b(?:part[- ]?time|meio\s+per[ií]odo)\b/i.test(text)) {
    result.employment_type = 'part-time'
  } else if (/\b(?:contract|contractor|contrato|PJ|pessoa\s+jur[ií]dica)\b/i.test(text)) {
    result.employment_type = 'contract'
  } else if (/\b(?:internship|intern|estágio|estagiário)\b/i.test(text)) {
    result.employment_type = 'internship'
  }

  // Common benefits (PT-BR + EN)
  const benefitPatterns: [RegExp, string][] = [
    [/\b(?:plano\s+de\s+saúde|health\s+(?:insurance|plan)|medical\s+(?:insurance|plan|coverage))\b/i, 'health insurance'],
    [/\b(?:plano\s+odontol[oó]gico|dental\s+(?:insurance|plan|coverage))\b/i, 'dental'],
    [/\b(?:vale[- ]?refei[çc][aã]o|meal\s+(?:allowance|voucher|stipend))\b/i, 'meal allowance'],
    [/\b(?:vale[- ]?alimenta[çc][aã]o|food\s+(?:allowance|voucher|stipend)|grocery\s+allowance)\b/i, 'food allowance'],
    [/\b(?:vale[- ]?transporte|transport(?:ation)?\s+(?:allowance|stipend|benefit))\b/i, 'transport allowance'],
    [/\b(?:gym(?:pass)?|wellhub|academia|wellness\s+(?:benefit|stipend|allowance))\b/i, 'wellness/gym'],
    [/\b(?:seguro\s+de\s+vida|life\s+insurance)\b/i, 'life insurance'],
    [/\b(?:PLR|PPR|profit\s+sharing|bônus|bonus|variable\s+(?:pay|compensation))\b/i, 'bonus/profit sharing'],
    [/\b(?:stock\s+options?|RSU|equity|a[çc][oõ]es)\b/i, 'equity/stock options'],
    [/\b(?:401\s*\(?k\)?|retirement|aposentadoria|previd[eê]ncia)\b/i, 'retirement plan'],
    [/\b(?:parental\s+leave|maternity|paternity|licen[çc]a[- ]?(?:maternidade|paternidade))\b/i, 'parental leave'],
    [/\b(?:PTO|paid\s+time\s+off|unlimited\s+(?:PTO|vacation)|f[eé]rias)\b/i, 'paid time off'],
    [/\b(?:home\s+office\s+(?:allowance|stipend)|auxílio\s+home\s+office|remote\s+(?:work\s+)?stipend)\b/i, 'home office allowance'],
    [/\b(?:education|tuition|learning\s+(?:budget|stipend)|treinamento|desenvolvimento)\b/i, 'education/learning'],
    [/\b(?:childcare|daycare|creche|aux[ií]lio[- ]?creche)\b/i, 'childcare'],
    [/\b(?:visa\s+sponsorship|relocation|relocação)\b/i, 'relocation/visa'],
  ]

  for (const [regex, label] of benefitPatterns) {
    if (regex.test(text)) {
      result.benefits.push(label)
    }
  }

  // Department from text
  const deptMatch = text.match(/(?:department|departamento|team|equipe|area|área)\s*[:\s]+\s*([A-Z][a-zA-ZÀ-ú &/,-]+?)(?:\s{2,}|[.;]|\s*$)/i)
  if (deptMatch) {
    result.department = deptMatch[1].trim()
  }

  return result
}

/**
 * Builds a structured metadata block from extracted job info to prepend to the raw description.
 */
export function buildMetadataBlock(meta: ExtractedJobMeta): string {
  const lines: string[] = []

  if (meta.salary) {
    lines.push(`SALARY INFORMATION FOUND: ${meta.salary.raw}`)
    if (meta.salary.period) lines.push(`SALARY PERIOD: ${meta.salary.period}`)
  }
  if (meta.location) lines.push(`LOCATION: ${meta.location}`)
  if (meta.remote_status) lines.push(`REMOTE STATUS: ${meta.remote_status}`)
  if (meta.employment_type) lines.push(`EMPLOYMENT TYPE: ${meta.employment_type}`)
  if (meta.department) lines.push(`DEPARTMENT: ${meta.department}`)
  if (meta.posted_at) lines.push(`POSTED DATE: ${meta.posted_at}`)
  if (meta.benefits.length > 0) lines.push(`BENEFITS: ${meta.benefits.join(', ')}`)

  return lines.join('\n')
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
