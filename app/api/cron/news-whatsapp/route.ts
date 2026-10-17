import { NextRequest, NextResponse } from 'next/server'
import { dispatchNewsWhatsapp } from '@/lib/news-whatsapp-dispatch'
export const dynamic = 'force-dynamic'
export const maxDuration = 60
const reply = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } })
export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return reply({ error: 'Unauthorized' }, 401)
  try { return reply(await dispatchNewsWhatsapp()) }
  catch { console.error('news_whatsapp_dispatch_failed'); return reply({ error: 'Envios indisponíveis agora.' }, 503) }
}
