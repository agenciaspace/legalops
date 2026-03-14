import { describe, it, expect } from 'vitest'
import { stripHtml, matchesKeywords, extractSalaryFromHtml, extractJobMetaFromHtml, buildMetadataBlock, parseSalaryToInteger } from '@/lib/utils'

describe('stripHtml', () => {
  it('removes HTML tags', () => {
    expect(stripHtml('<p>Hello <b>world</b></p>')).toBe('Hello world')
  })

  it('decodes HTML entities', () => {
    expect(stripHtml('R&amp;D &gt; 5 years')).toBe('R&D > 5 years')
  })

  it('collapses whitespace', () => {
    expect(stripHtml('<p>  lots   of   spaces  </p>')).toBe('lots of spaces')
  })

  it('returns empty string for empty input', () => {
    expect(stripHtml('')).toBe('')
  })
})

describe('matchesKeywords', () => {
  const KEYWORDS = ['legal operations', 'legal ops', 'clm']

  it('matches exact keyword', () => {
    expect(matchesKeywords('Head of Legal Operations', KEYWORDS)).toBe(true)
  })

  it('matches case-insensitively', () => {
    expect(matchesKeywords('LEGAL OPS Manager', KEYWORDS)).toBe(true)
  })

  it('returns false when no keyword matches', () => {
    expect(matchesKeywords('Software Engineer', KEYWORDS)).toBe(false)
  })

  it('matches partial word in title', () => {
    expect(matchesKeywords('VP of CLM Solutions', KEYWORDS)).toBe(true)
  })
})

// ─── Salary extraction tests ───

describe('extractSalaryFromHtml', () => {
  it('returns null for empty input', () => {
    expect(extractSalaryFromHtml('')).toBeNull()
  })

  it('returns null when no salary info is found', () => {
    const html = '<html><body><h1>Legal Operations Manager</h1><p>Great job at Acme Corp</p></body></html>'
    expect(extractSalaryFromHtml(html)).toBeNull()
  })

  // Greenhouse
  it('extracts Greenhouse pay_ranges JSON', () => {
    const html = `<script>window.__remixContext = {"jobPost":{"pay_ranges":[{"title":"Annual Base Salary Range:","description":"Pay info","min":"$122,000","max":"$238,000","currency_type":"USD"}]}}</script>`
    const result = extractSalaryFromHtml(html)
    expect(result).not.toBeNull()
    expect(result!.min).toBe('$122,000')
    expect(result!.max).toBe('$238,000')
    expect(result!.currency).toBe('USD')
    expect(result!.raw).toBe('$122,000 - $238,000 USD')
  })

  it('extracts Greenhouse pay_ranges with BRL currency', () => {
    const html = `{"pay_ranges":[{"min":"R$8.000","max":"R$15.000","currency_type":"BRL"}]}`
    const result = extractSalaryFromHtml(html)
    expect(result).not.toBeNull()
    expect(result!.min).toBe('R$8.000')
    expect(result!.max).toBe('R$15.000')
    expect(result!.currency).toBe('BRL')
  })

  it('extracts Greenhouse pay period from title', () => {
    const html = `{"pay_ranges":[{"title":"Monthly Salary Range:","min":"$10,000","max":"$15,000","currency_type":"USD"}]}`
    const result = extractSalaryFromHtml(html)
    expect(result).not.toBeNull()
    expect(result!.period).toBe('month')
  })

  // JSON-LD
  it('extracts JSON-LD baseSalary', () => {
    const html = `<script type="application/ld+json">{"@type":"JobPosting","baseSalary":{"currency":"USD","value":{"minValue":100000,"maxValue":150000}}}</script>`
    const result = extractSalaryFromHtml(html)
    expect(result).not.toBeNull()
    expect(result!.min).toBe('100000')
    expect(result!.max).toBe('150000')
    expect(result!.currency).toBe('USD')
  })

  it('extracts JSON-LD estimatedSalary', () => {
    const html = `<script type="application/ld+json">{"@type":"JobPosting","estimatedSalary":[{"currency":"EUR","value":{"minValue":60000,"maxValue":90000}}]}</script>`
    const result = extractSalaryFromHtml(html)
    expect(result).not.toBeNull()
    expect(result!.min).toBe('60000')
    expect(result!.max).toBe('90000')
    expect(result!.currency).toBe('EUR')
  })

  it('extracts JSON-LD with unitText', () => {
    const html = `<script type="application/ld+json">{"@type":"JobPosting","baseSalary":{"currency":"USD","value":{"minValue":50,"maxValue":75,"unitText":"HOUR"}}}</script>`
    const result = extractSalaryFromHtml(html)
    expect(result).not.toBeNull()
    expect(result!.min).toBe('50')
    expect(result!.max).toBe('75')
    expect(result!.period).toBe('hour')
  })

  it('extracts JSON-LD from @graph array', () => {
    const html = `<script type="application/ld+json">{"@graph":[{"@type":"Organization"},{"@type":"JobPosting","baseSalary":{"currency":"GBP","value":{"minValue":70000,"maxValue":90000}}}]}</script>`
    const result = extractSalaryFromHtml(html)
    expect(result).not.toBeNull()
    expect(result!.currency).toBe('GBP')
    expect(result!.min).toBe('70000')
  })

  // Lever
  it('extracts Lever salaryRange JSON', () => {
    const html = `<script>{"salaryRange":{"min":120000,"max":180000,"currency":"USD"}}</script>`
    const result = extractSalaryFromHtml(html)
    expect(result).not.toBeNull()
    expect(result!.min).toBe('120000')
    expect(result!.max).toBe('180000')
    expect(result!.currency).toBe('USD')
  })

  it('extracts Lever compensation text', () => {
    const html = `<script>{"compensation":"$120,000 - $180,000 per year"}</script>`
    const result = extractSalaryFromHtml(html)
    expect(result).not.toBeNull()
    expect(result!.raw).toBe('$120,000 - $180,000 per year')
  })

  // Gupy
  it('extracts Gupy salaryFrom/salaryTo', () => {
    const html = `{"salaryFrom":8000,"salaryTo":15000}`
    const result = extractSalaryFromHtml(html)
    expect(result).not.toBeNull()
    expect(result!.min).toBe('8000')
    expect(result!.max).toBe('15000')
    expect(result!.currency).toBe('BRL')
  })

  it('extracts Gupy faixaSalarial', () => {
    const html = `{"faixaSalarial":"R$8.000 a R$15.000"}`
    const result = extractSalaryFromHtml(html)
    expect(result).not.toBeNull()
    expect(result!.raw).toBe('R$8.000 a R$15.000')
  })

  // Workable
  it('extracts Workable salary object', () => {
    const html = `{"salary":{"salary_from":90000,"salary_to":130000,"currency":"USD"}}`
    const result = extractSalaryFromHtml(html)
    expect(result).not.toBeNull()
    expect(result!.min).toBe('90000')
    expect(result!.max).toBe('130000')
    expect(result!.currency).toBe('USD')
  })

  // Generic JSON
  it('extracts generic salary_min/salary_max JSON', () => {
    const html = `{"salary_min":100000,"salary_max":150000,"salary_currency":"USD"}`
    const result = extractSalaryFromHtml(html)
    expect(result).not.toBeNull()
    expect(result!.min).toBe('100000')
    expect(result!.max).toBe('150000')
    expect(result!.currency).toBe('USD')
  })

  // Text patterns: symbol ranges
  it('extracts USD salary range from plain text', () => {
    const html = '<p>The salary for this role is $95,000 - $130,000 USD per year.</p>'
    const result = extractSalaryFromHtml(html)
    expect(result).not.toBeNull()
    expect(result!.min).toBe('$95,000')
    expect(result!.max).toBe('$130,000')
    expect(result!.currency).toBe('USD')
  })

  it('extracts BRL salary range from plain text', () => {
    const html = '<div>Faixa salarial: R$12.000 - R$18.000</div>'
    const result = extractSalaryFromHtml(html)
    expect(result).not.toBeNull()
    expect(result!.min).toBe('R$12.000')
    expect(result!.max).toBe('R$18.000')
    expect(result!.currency).toBe('BRL')
  })

  it('extracts EUR salary range from plain text', () => {
    const html = '<span>€50,000 - €80,000</span>'
    const result = extractSalaryFromHtml(html)
    expect(result).not.toBeNull()
    expect(result!.min).toBe('€50,000')
    expect(result!.max).toBe('€80,000')
    expect(result!.currency).toBe('EUR')
  })

  it('extracts GBP salary range', () => {
    const html = '<p>£45,000 - £65,000</p>'
    const result = extractSalaryFromHtml(html)
    expect(result).not.toBeNull()
    expect(result!.min).toBe('£45,000')
    expect(result!.max).toBe('£65,000')
    expect(result!.currency).toBe('GBP')
  })

  // Text patterns: "to" separator
  it('extracts "to" separator range', () => {
    const html = '<p>$95,000 to $130,000</p>'
    const result = extractSalaryFromHtml(html)
    expect(result).not.toBeNull()
    expect(result!.min).toBe('$95,000')
    expect(result!.max).toBe('$130,000')
  })

  it('extracts "a" separator range (PT-BR)', () => {
    const html = '<p>R$8.000 a R$15.000</p>'
    const result = extractSalaryFromHtml(html)
    expect(result).not.toBeNull()
    expect(result!.min).toBe('R$8.000')
    expect(result!.max).toBe('R$15.000')
    expect(result!.currency).toBe('BRL')
  })

  // Text patterns: numeric range with currency code
  it('extracts numeric range with currency code', () => {
    const html = '<p>120,000 - 180,000 USD</p>'
    const result = extractSalaryFromHtml(html)
    expect(result).not.toBeNull()
    expect(result!.min).toBe('120,000')
    expect(result!.max).toBe('180,000')
    expect(result!.currency).toBe('USD')
  })

  // Text patterns: k notation
  it('extracts k notation salary range', () => {
    const html = '<p>$120k - $180k</p>'
    const result = extractSalaryFromHtml(html)
    expect(result).not.toBeNull()
    expect(result!.min).toBe('$120k')
    expect(result!.max).toBe('$180k')
    expect(result!.currency).toBe('USD')
  })

  // Text patterns: labeled
  it('extracts labeled salary range', () => {
    const html = '<p>Compensation: $120,000 - $180,000</p>'
    const result = extractSalaryFromHtml(html)
    expect(result).not.toBeNull()
    expect(result!.min).toBe('$120,000')
    expect(result!.max).toBe('$180,000')
  })

  it('extracts OTE labeled salary', () => {
    const html = '<p>OTE: $200k - $280k</p>'
    const result = extractSalaryFromHtml(html)
    expect(result).not.toBeNull()
    expect(result!.min).toBe('$200k')
    expect(result!.max).toBe('$280k')
  })

  // Text patterns: single salary with period
  it('extracts single salary with per year', () => {
    const html = '<p>This position pays $150,000 per year.</p>'
    const result = extractSalaryFromHtml(html)
    expect(result).not.toBeNull()
    expect(result!.min).toBe('$150,000')
    expect(result!.currency).toBe('USD')
    expect(result!.period).toBe('year')
  })

  it('extracts single salary with monthly period PT-BR', () => {
    const html = '<p>Salário: R$15.000/mês</p>'
    const result = extractSalaryFromHtml(html)
    expect(result).not.toBeNull()
    expect(result!.min).toBe('R$15.000')
    expect(result!.currency).toBe('BRL')
    expect(result!.period).toBe('month')
  })

  it('extracts hourly rate', () => {
    const html = '<p>$75 per hour</p>'
    const result = extractSalaryFromHtml(html)
    expect(result).not.toBeNull()
    expect(result!.min).toBe('$75')
    expect(result!.period).toBe('hour')
  })

  // Priority
  it('prioritizes structured data over text patterns', () => {
    const html = `
      <script>window.data = {"pay_ranges":[{"min":"$100,000","max":"$200,000","currency_type":"USD"}]}</script>
      <p>Salary: $80,000 - $120,000</p>
    `
    const result = extractSalaryFromHtml(html)
    expect(result).not.toBeNull()
    expect(result!.min).toBe('$100,000')
    expect(result!.max).toBe('$200,000')
  })
})

// ─── Full metadata extraction tests ───

describe('extractJobMetaFromHtml', () => {
  it('returns empty metadata for empty input', () => {
    const meta = extractJobMetaFromHtml('')
    expect(meta.salary).toBeNull()
    expect(meta.location).toBeNull()
    expect(meta.benefits).toEqual([])
  })

  it('extracts salary + location + employment type from JSON-LD', () => {
    const html = `<script type="application/ld+json">{
      "@type": "JobPosting",
      "baseSalary": {"currency": "USD", "value": {"minValue": 120000, "maxValue": 180000}},
      "jobLocation": {"address": {"addressLocality": "San Francisco", "addressRegion": "CA", "addressCountry": "US"}},
      "employmentType": "FULL_TIME",
      "datePosted": "2026-03-01"
    }</script>`
    const meta = extractJobMetaFromHtml(html)
    expect(meta.salary).not.toBeNull()
    expect(meta.salary!.min).toBe('120000')
    expect(meta.location).toBe('San Francisco, CA, US')
    expect(meta.employment_type).toBe('FULL_TIME')
    expect(meta.posted_at).toBe('2026-03-01')
  })

  it('extracts location from embedded JSON', () => {
    const html = `{"location":{"name":"São Paulo, SP"}}`
    const meta = extractJobMetaFromHtml(html)
    expect(meta.location).toBe('São Paulo, SP')
  })

  it('extracts remote status from embedded JSON', () => {
    const html = `{"is_remote":true}`
    const meta = extractJobMetaFromHtml(html)
    expect(meta.remote_status).toBe('true')
  })

  it('extracts department from embedded JSON', () => {
    const html = `{"department":"Legal"}`
    const meta = extractJobMetaFromHtml(html)
    expect(meta.department).toBe('Legal')
  })

  it('extracts benefits from embedded JSON', () => {
    const html = `{"benefits":["Health insurance","401k","PTO"]}`
    const meta = extractJobMetaFromHtml(html)
    expect(meta.benefits).toContain('Health insurance')
    expect(meta.benefits).toContain('401k')
  })

  it('detects remote status from text keywords', () => {
    const html = '<p>This is a fully remote position.</p>'
    const meta = extractJobMetaFromHtml(html)
    expect(meta.remote_status).toBe('remote')
  })

  it('detects hybrid status from text keywords', () => {
    const html = '<p>This role is hybrid with 3 days in-office.</p>'
    const meta = extractJobMetaFromHtml(html)
    expect(meta.remote_status).toBe('hybrid')
  })

  it('detects onsite status from text', () => {
    const html = '<p>This position is presencial in São Paulo.</p>'
    const meta = extractJobMetaFromHtml(html)
    expect(meta.remote_status).toBe('onsite')
  })

  it('detects employment type from text', () => {
    const html = '<p>Full-time position with benefits.</p>'
    const meta = extractJobMetaFromHtml(html)
    expect(meta.employment_type).toBe('full-time')
  })

  it('detects PJ contract from text (PT-BR)', () => {
    const html = '<p>Contratação PJ com salário competitivo.</p>'
    const meta = extractJobMetaFromHtml(html)
    expect(meta.employment_type).toBe('contract')
  })

  it('detects benefits from text (EN)', () => {
    const html = '<p>We offer health insurance, 401k matching, unlimited PTO, and stock options.</p>'
    const meta = extractJobMetaFromHtml(html)
    expect(meta.benefits).toContain('health insurance')
    expect(meta.benefits).toContain('retirement plan')
    expect(meta.benefits).toContain('paid time off')
    expect(meta.benefits).toContain('equity/stock options')
  })

  it('detects benefits from text (PT-BR)', () => {
    const html = '<p>Benefícios: plano de saúde, vale refeição, vale transporte, seguro de vida, PLR.</p>'
    const meta = extractJobMetaFromHtml(html)
    expect(meta.benefits).toContain('health insurance')
    expect(meta.benefits).toContain('meal allowance')
    expect(meta.benefits).toContain('transport allowance')
    expect(meta.benefits).toContain('life insurance')
    expect(meta.benefits).toContain('bonus/profit sharing')
  })

  it('deduplicates benefits between JSON and text', () => {
    const html = `{"benefits":["health insurance"]}<p>We offer health insurance and stock options.</p>`
    const meta = extractJobMetaFromHtml(html)
    const healthCount = meta.benefits.filter(b => b === 'health insurance').length
    expect(healthCount).toBe(1)
    expect(meta.benefits).toContain('equity/stock options')
  })
})

// ─── Metadata block builder tests ───

describe('buildMetadataBlock', () => {
  it('returns empty string when no metadata', () => {
    const block = buildMetadataBlock({ salary: null, location: null, remote_status: null, employment_type: null, benefits: [], posted_at: null, department: null })
    expect(block).toBe('')
  })

  it('builds full metadata block', () => {
    const block = buildMetadataBlock({
      salary: { min: '$120,000', max: '$180,000', currency: 'USD', period: 'year', raw: '$120,000 - $180,000 USD' },
      location: 'San Francisco, CA',
      remote_status: 'hybrid',
      employment_type: 'FULL_TIME',
      benefits: ['health insurance', 'stock options'],
      posted_at: '2026-03-01',
      department: 'Legal',
    })
    expect(block).toContain('SALARY INFORMATION FOUND: $120,000 - $180,000 USD')
    expect(block).toContain('SALARY PERIOD: year')
    expect(block).toContain('LOCATION: San Francisco, CA')
    expect(block).toContain('REMOTE STATUS: hybrid')
    expect(block).toContain('EMPLOYMENT TYPE: FULL_TIME')
    expect(block).toContain('DEPARTMENT: Legal')
    expect(block).toContain('POSTED DATE: 2026-03-01')
    expect(block).toContain('BENEFITS: health insurance, stock options')
  })

  it('includes only available fields', () => {
    const block = buildMetadataBlock({
      salary: { min: '$100k', max: '$150k', currency: 'USD', period: null, raw: '$100k - $150k USD' },
      location: null,
      remote_status: 'remote',
      employment_type: null,
      benefits: [],
      posted_at: null,
      department: null,
    })
    expect(block).toContain('SALARY INFORMATION FOUND')
    expect(block).toContain('REMOTE STATUS: remote')
    expect(block).not.toContain('LOCATION')
    expect(block).not.toContain('EMPLOYMENT TYPE')
    expect(block).not.toContain('BENEFITS')
  })
})

// ─── parseSalaryToInteger tests ───

describe('parseSalaryToInteger', () => {
  it('returns null for null/undefined/empty', () => {
    expect(parseSalaryToInteger(null)).toBeNull()
    expect(parseSalaryToInteger(undefined)).toBeNull()
    expect(parseSalaryToInteger('')).toBeNull()
  })

  it('parses US format: $122,000', () => {
    expect(parseSalaryToInteger('$122,000')).toBe(122000)
  })

  it('parses US format: $238,000', () => {
    expect(parseSalaryToInteger('$238,000')).toBe(238000)
  })

  it('parses BR format: R$8.000', () => {
    expect(parseSalaryToInteger('R$8.000')).toBe(8000)
  })

  it('parses BR format: R$15.000', () => {
    expect(parseSalaryToInteger('R$15.000')).toBe(15000)
  })

  it('parses plain number: 150000', () => {
    expect(parseSalaryToInteger('150000')).toBe(150000)
  })

  it('parses k notation: $120k', () => {
    expect(parseSalaryToInteger('$120k')).toBe(120000)
  })

  it('parses K notation: $120K', () => {
    expect(parseSalaryToInteger('$120K')).toBe(120000)
  })

  it('parses EUR: €50,000', () => {
    expect(parseSalaryToInteger('€50,000')).toBe(50000)
  })

  it('parses GBP: £45,000', () => {
    expect(parseSalaryToInteger('£45,000')).toBe(45000)
  })

  it('parses European format: 1.000,50', () => {
    expect(parseSalaryToInteger('€1.000,50')).toBe(1001)
  })

  it('parses decimal US: 150,000.50', () => {
    expect(parseSalaryToInteger('$150,000.50')).toBe(150001)
  })

  it('parses hourly: $75', () => {
    expect(parseSalaryToInteger('$75')).toBe(75)
  })
})
