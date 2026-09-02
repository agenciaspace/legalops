const CURRENCY_SYMBOLS: Record<string, string> = {
  BRL: 'R$',
  USD: 'US$',
  EUR: '€',
  GBP: '£',
}

function symbolFor(code: string | null): string {
  if (!code) return ''
  return CURRENCY_SYMBOLS[code.toUpperCase()] ?? code
}

function localeFor(code: string | null): string {
  if (!code) return 'pt-BR'
  switch (code.toUpperCase()) {
    case 'BRL': return 'pt-BR'
    case 'USD': return 'en-US'
    case 'EUR': return 'de-DE'
    case 'GBP': return 'en-GB'
    default: return 'pt-BR'
  }
}

function formatNumber(n: number, currency: string | null): string {
  return n.toLocaleString(localeFor(currency), { maximumFractionDigits: 0 })
}

export interface SalaryInput {
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
}

export function normalizeSalaryRange(
  salaryMin: number | null,
  salaryMax: number | null,
): Pick<SalaryInput, 'salary_min' | 'salary_max'> {
  const min = typeof salaryMin === 'number' && Number.isFinite(salaryMin) && salaryMin > 0
    ? salaryMin
    : null
  const max = typeof salaryMax === 'number' && Number.isFinite(salaryMax) && salaryMax > 0
    ? salaryMax
    : null

  if (min !== null && max !== null && min > max) {
    return { salary_min: max, salary_max: min }
  }

  return { salary_min: min, salary_max: max }
}

export function parseSalaryNumber(value: string | null): number | null {
  if (!value) return null

  const compact = value.trim()
  const multiplier = /(?:k|mil)\s*$/i.test(compact) ? 1_000 : 1
  let numeric = compact
    .replace(/(?:k|mil)\s*$/i, '')
    .replace(/[^\d.,+-]/g, '')

  if (!numeric || !/\d/.test(numeric)) return null

  const lastDot = numeric.lastIndexOf('.')
  const lastComma = numeric.lastIndexOf(',')

  if (lastDot >= 0 && lastComma >= 0) {
    if (lastComma > lastDot) {
      numeric = numeric.replace(/\./g, '').replace(',', '.')
    } else {
      numeric = numeric.replace(/,/g, '')
    }
  } else if (/^\d{1,3}([.,]\d{3})+$/.test(numeric)) {
    numeric = numeric.replace(/[.,]/g, '')
  } else if (lastComma >= 0) {
    numeric = numeric.replace(',', '.')
  }

  const parsed = Number.parseFloat(numeric)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return Math.round(parsed * multiplier)
}

/**
 * Formats salary range with proper currency symbols and locale-aware number formatting.
 * Returns `fallback` when both min and max are null.
 */
export function formatSalary(
  input: SalaryInput,
  fallback = 'Nao divulgado',
): string {
  const { salary_currency } = input
  const { salary_min, salary_max } = normalizeSalaryRange(input.salary_min, input.salary_max)
  if (!salary_min && !salary_max) return fallback

  const symbol = symbolFor(salary_currency)
  const sep = symbol ? ' ' : ''

  if (salary_min && salary_max) {
    if (salary_min === salary_max) {
      return `${symbol}${sep}${formatNumber(salary_min, salary_currency)}`
    }
    return `${symbol}${sep}${formatNumber(salary_min, salary_currency)} – ${formatNumber(salary_max, salary_currency)}`
  }

  const value = salary_min ?? salary_max!
  return `${symbol}${sep}${formatNumber(value, salary_currency)}`
}

/**
 * Returns true when salary data is available.
 */
export function hasSalary(input: SalaryInput): boolean {
  return !!(input.salary_min || input.salary_max)
}
