export const CONTACT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const contactUrl = (id: string) => `https://legalops.club/contact/${id}`
export const contactReturnPath = (path?: string | null) => /^\/contact\/[0-9a-f-]{36}$/i.test(path ?? '') && CONTACT_ID.test((path ?? '').split('/')[2]) ? path! : null

export type ContactDetails = { email: string | null; phone: string | null; website: string | null; public_enabled: boolean }
export type ContactCard = ContactDetails & { user_id: string; display_name: string; current_role: string | null; organization_name: string | null; linkedin_url: string | null }

export function validateContactDetails(input: Record<string, unknown>): { details: ContactDetails; error?: never } | { error: string; details?: never } {
  const email = String(input.email ?? '').trim()
  const rawPhone = String(input.phone ?? '').trim()
  const phone = rawPhone.replace(/[\s().-]/g, '')
  const website = String(input.website ?? '').trim()
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || /[\r\n]/.test(email))) return { error: 'Confira o email de contato.' }
  if (phone && !/^\+[0-9]{8,15}$/.test(phone)) return { error: 'Use o telefone com código do país. Ex.: +55 11 99999-9999.' }
  if (website) {
    try { const url = new URL(website); if (url.protocol !== 'https:' || url.username || url.password || website.length > 500) throw new Error() }
    catch { return { error: 'Use um endereço de site válido começando com https://.' } }
  }
  return { details: { email: email || null, phone: phone || null, website: website || null, public_enabled: input.public_enabled === true } }
}

export function vcard(card: ContactCard) {
  const escape = (value: string) => value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,')
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${escape(card.display_name)}`, `N:;${escape(card.display_name)};;;`, `UID:${card.user_id}`]
  if (card.organization_name) lines.push(`ORG:${escape(card.organization_name)}`)
  if (card.current_role) lines.push(`TITLE:${escape(card.current_role)}`)
  if (card.email) lines.push(`EMAIL;TYPE=INTERNET:${escape(card.email)}`)
  if (card.phone) lines.push(`TEL;TYPE=CELL:${escape(card.phone)}`)
  if (card.website) lines.push(`URL:${escape(card.website)}`)
  if (card.linkedin_url) lines.push(`URL:${escape(card.linkedin_url)}`)
  lines.push(`URL:${contactUrl(card.user_id)}`, 'END:VCARD')
  // Fold by UTF-8 octets without splitting accented characters.
  return lines.map(line => {
    let out = '', size = 0
    for (const char of Array.from(line)) {
      const bytes = new TextEncoder().encode(char).length
      if (size + bytes > 75) { out += '\r\n '; size = 1 }
      out += char; size += bytes
    }
    return out
  }).join('\r\n') + '\r\n'
}
