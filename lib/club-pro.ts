export const PRO_PIX_KEY = 'leonhatori@gmail.com'
export const PRO_SUPPORT_EMAIL = 'hi@legalops.club'
export const PRO_PAYMENT_URL = 'https://mpago.la/2gCAVGU'
export const PRO_PILOT_PRICE_CENTS = 4900
export const PRO_TRIAL_DAYS = 7
export const PRO_INCLUDED_CREDITS = 300
export const PRO_DAILY_QUESTIONS = 30
export const PRO_RECEIPT_BUCKET = 'club-pro-receipts'
export const PRO_RECEIPT_MAX_BYTES = 5 * 1024 * 1024
export type ProOffer = { price_cents: number | null; period_months: number | null; active: boolean; payment_mode?: string; payment_url?: string | null; trial_days?: number }
export function isProOfferOpen(offer: ProOffer | null): offer is ProOffer & { price_cents: number; period_months: number } {
  return Boolean(offer?.active && Number.isInteger(offer.price_cents) && offer.price_cents! >= 100 && [1,12].includes(offer.period_months!) && (offer.payment_mode!=='mercadopago_subscription' || (offer.period_months===1 && offer.trial_days===7 && proPaymentUrl(offer))))
}
export function proPaymentUrl(offer: Pick<ProOffer,'payment_mode'|'payment_url'> | null) {
  if (offer?.payment_mode !== 'mercadopago_subscription' || !offer.payment_url) return null
  try {
    const url = new URL(offer.payment_url)
    return url.protocol === 'https:' && url.hostname === 'mpago.la' && !url.username && !url.password && /^\/[A-Za-z0-9]+$/.test(url.pathname) && !url.search && !url.hash ? url.href : null
  } catch { return null }
}
export function proPrice(cents: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100) }
export function receiptFileType(bytes: Uint8Array): { extension: string; contentType: string } | null {
  if ([0x25,0x50,0x44,0x46,0x2d].every((value,i) => bytes[i] === value)) return { extension: 'pdf', contentType: 'application/pdf' }
  if ([137,80,78,71,13,10,26,10].every((value,i) => bytes[i] === value)) return { extension: 'png', contentType: 'image/png' }
  if ([255,216,255].every((value,i) => bytes[i] === value)) return { extension: 'jpg', contentType: 'image/jpeg' }
  return null
}
