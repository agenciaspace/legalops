import { describe, it, expect } from 'vitest'
import { stripHtml, matchesKeywords, extractSalaryFromHtml } from '@/lib/utils'

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

describe('extractSalaryFromHtml', () => {
  it('returns null for empty input', () => {
    expect(extractSalaryFromHtml('')).toBeNull()
  })

  it('returns null when no salary info is found', () => {
    const html = '<html><body><h1>Legal Operations Manager</h1><p>Great job at Acme Corp</p></body></html>'
    expect(extractSalaryFromHtml(html)).toBeNull()
  })

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

  it('extracts Lever salaryRange JSON', () => {
    const html = `<script>{"salaryRange":{"min":120000,"max":180000,"currency":"USD"}}</script>`
    const result = extractSalaryFromHtml(html)
    expect(result).not.toBeNull()
    expect(result!.min).toBe('120000')
    expect(result!.max).toBe('180000')
    expect(result!.currency).toBe('USD')
  })

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

  it('extracts single salary with per year', () => {
    const html = '<p>This position pays $150,000 per year.</p>'
    const result = extractSalaryFromHtml(html)
    expect(result).not.toBeNull()
    expect(result!.min).toBe('$150,000')
    expect(result!.currency).toBe('USD')
  })

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
