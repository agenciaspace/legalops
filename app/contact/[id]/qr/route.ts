import QRCode from 'qrcode'
import { CONTACT_ID, contactUrl } from '@/lib/contact-card'
export async function GET(request: Request, { params }: { params: { id: string } }) {
  if (!CONTACT_ID.test(params.id)) return new Response('Not found', { status: 404 })
  const svg = await QRCode.toString(contactUrl(params.id), { type: 'svg', width: 320, margin: 4, errorCorrectionLevel: 'M' })
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400', 'Content-Disposition': new URL(request.url).searchParams.has('download') ? 'attachment; filename="meu-qr-code.svg"' : 'inline', 'X-Content-Type-Options': 'nosniff' } })
}
