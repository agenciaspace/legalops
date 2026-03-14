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

/**
 * Formats salary range with proper currency symbols and locale-aware number formatting.
 * Returns `fallback` when both min and max are null.
 */
export function formatSalary(
  input: SalaryInput,
  fallback = 'Nao divulgado',
): string {
  const { salary_min, salary_max, salary_currency } = input
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
