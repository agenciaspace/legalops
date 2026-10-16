import { createHmac } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { parseNewsSignup } from '@/lib/news'
import { newsSameOrigin, readNewsJson } from '@/lib/news-http'
import { beehiivConfigured } from '@/lib/news-beehiiv'

export const dynamic = 'force-dynamic'
export async function POST(request: NextRequest) {
  const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', ...(status === 429 ? { 'Retry-After': '3600' } : {}) } })
  if (!newsSameOrigin(request)) return reply({ error: 'Faça a inscrição pelo site.' }, 403)
  let input
  try { input = parseNewsSignup(await readNewsJson(request, 6000)) } catch (error) { return reply({ error: error instanceof Error ? error.message : 'Confira os campos.' }, 400) }
  if (input.honeypot) return reply({ message: 'Cadastro recebido.' }, 202)
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  const ip = request.headers.get('cf-connecting-ip')
  if (!secret || !ip) return reply({ error: 'Inscrição indisponível agora. Tente novamente.' }, 503)
  const db = createAdminClient()
  const { error } = await db.rpc('register_news_signup', { contact_email: input.email, selected_audiences: input.audiences, selected_topics: input.topics, network_key: createHmac('sha256', secret).update(`news:${ip}`).digest('hex'), signup_source: request.nextUrl.hostname.includes('club') ? 'club' : 'news' })
  if (error) return reply({ error: error.message.includes('NEWS_RATE_LIMIT') ? 'Muitas tentativas. Tente novamente em uma hora.' : 'Não conseguimos registrar sua inscrição. Tente novamente.' }, error.message.includes('NEWS_RATE_LIMIT') ? 429 : 503)
  return reply({ status: 'registered', message: beehiivConfigured() ? 'Cadastro registrado. A confirmação será enviada por email. Se você já assina, sua inscrição será preservada.' : 'Interesse registrado. Quando a newsletter abrir, enviaremos um email para você confirmar a assinatura.' }, 202)
}
