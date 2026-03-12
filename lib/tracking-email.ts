/**
 * Generates a unique tracking email address for a pipeline entry.
 * Format: vaga-{8-char-alphanumeric}@{TRACKING_EMAIL_DOMAIN}
 */

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

function randomSlug(length = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, b => ALPHABET[b % ALPHABET.length]).join('')
}

export function generateTrackingEmail(): string {
  const domain = process.env.TRACKING_EMAIL_DOMAIN || 'inbound.legalops.work'
  return `vaga-${randomSlug()}@${domain}`
}
