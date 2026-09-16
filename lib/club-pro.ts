export const PRO_PIX_KEY = 'leonhatori@gmail.com'
export const PRO_DAILY_QUESTIONS = 30
export const PRO_RECEIPT_BUCKET = 'club-pro-receipts'
export const PRO_RECEIPT_MAX_BYTES = 5 * 1024 * 1024
export type ProOffer = { price_cents: number | null; period_months: number | null; active: boolean }
export function isProOfferOpen(offer: ProOffer | null): offer is ProOffer & { price_cents: number; period_months: number } {
  return Boolean(offer?.active && Number.isInteger(offer.price_cents) && offer.price_cents! >= 100 && [1,12].includes(offer.period_months!))
}
export function proPrice(cents: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100) }
export function receiptFileType(bytes: Uint8Array): { extension: string; contentType: string } | null {
  if ([0x25,0x50,0x44,0x46,0x2d].every((value,i) => bytes[i] === value)) return { extension: 'pdf', contentType: 'application/pdf' }
  if ([137,80,78,71,13,10,26,10].every((value,i) => bytes[i] === value)) return { extension: 'png', contentType: 'image/png' }
  if ([255,216,255].every((value,i) => bytes[i] === value)) return { extension: 'jpg', contentType: 'image/jpeg' }
  return null
}
