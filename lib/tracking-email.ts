/**
 * Two-tier tracking email system:
 *
 * Tier 1 (random):  vaga-x7k9m2ab@inbound.legalops.work   — unique per job, fully anonymous
 * Tier 2 (custom):  leon+nubank-sre@legalops.work          — personal alias with job tag
 */

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

function randomSlug(length = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, b => ALPHABET[b % ALPHABET.length]).join('')
}

/** Tier 1: random tracking email */
export function generateTrackingEmail(): string {
  const domain = process.env.TRACKING_EMAIL_DOMAIN || 'inbound.legalops.work'
  return `vaga-${randomSlug()}@${domain}`
}

/** Tier 2: personalized email with plus-addressing tag */
export function generateCustomEmail(alias: string, company: string, jobTitle: string): string {
  const domain = process.env.CUSTOM_EMAIL_DOMAIN || 'legalops.work'
  const tag = slugify(`${company}-${jobTitle}`)
  return `${alias}+${tag}@${domain}`
}

/** Create a URL-safe slug from text */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')     // non-alphanumeric → dash
    .replace(/^-+|-+$/g, '')         // trim leading/trailing dashes
    .slice(0, 40)                    // keep it short
}

/** Parse a plus-addressed email: "leon+nubank-sre@legalops.work" → { alias: "leon", tag: "nubank-sre" } */
export function parsePlusAddress(email: string): { alias: string; tag: string } | null {
  const match = email.match(/^([^+@]+)\+([^@]+)@/)
  if (!match) return null
  return { alias: match[1], tag: match[2] }
}
