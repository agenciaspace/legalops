/** Format validation only: this does not verify ownership or group membership. */
export function normalizeBenchPhone(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const raw = value.trim()
  if (raw.length > 40 || !/^\+[\d\s().-]+$/.test(raw)) return null
  const digits = raw.replace(/\D/g, '')
  if (!/^[1-9]\d{7,14}$/.test(digits)) return null
  if (digits.startsWith('55') && !/^55[1-9]\d\d{8,9}$/.test(digits)) return null
  return `+${digits}`
}
