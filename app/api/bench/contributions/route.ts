import { createHmac } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { BenchValidationError, parseBenchSubmission, publicBenchEntry } from '@/lib/bench-contributions'

export const dynamic = 'force-dynamic'
const allowedOrigins = new Set(['https://legalops.dev', 'https://www.legalops.dev', 'https://legalops.club', 'https://www.legalops.club', 'https://legalops.work'])
function response(request: NextRequest, body: unknown, status = 200) {
  const headers: Record<string, string> = { 'Cache-Control': 'no-store', Vary: 'Origin' }
  const origin = request.headers.get('origin')
  if (origin && allowedOrigins.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    headers['Access-Control-Allow-Headers'] = 'Content-Type'
  }
  if (status === 429) headers['Retry-After'] = '86400'
  return status === 204 ? new NextResponse(null, { status, headers }) : NextResponse.json(body, { status, headers })
}
export async function OPTIONS(request: NextRequest) {
  return response(request, null, allowedOrigins.has(request.headers.get('origin') || '') ? 204 : 403)
}
export async function GET(request: NextRequest) {
  const page = Number(request.nextUrl.searchParams.get('page') || 0)
  if (!Number.isInteger(page) || page < 0 || page > 10000) return response(request, { error: 'Página inválida.' }, 400)
  const { data, error, count } = await createAdminClient().from('bench_contribution_publications')
    .select('id,content,published_at,review_note', { count: 'exact' }).eq('is_public', true)
    .order('published_at', { ascending: false }).order('id', { ascending: true }).range(page * 20, page * 20 + 19)
  if (error) return response(request, { error: 'As contribuições estão indisponíveis agora. Tente novamente.' }, 503)
  try { return response(request, { entries: (data || []).map(publicBenchEntry), total: count || 0, page, has_more: (page + 1) * 20 < (count || 0) }) }
  catch { return response(request, { error: 'Não conseguimos carregar as contribuições. Tente novamente.' }, 503) }
}
export async function POST(request: NextRequest) {
  if (!allowedOrigins.has(request.headers.get('origin') || '')) return response(request, { error: 'Envie a contribuição pelo site do Bench.' }, 403)
  if (!(request.headers.get('content-type') || '').includes('application/json')) return response(request, { error: 'Formato inválido.' }, 415)
  if (Number(request.headers.get('content-length') || 0) > 20000) return response(request, { error: 'Contribuição muito longa.' }, 413)
  try {
    // Bound the stream too: Content-Length is not trusted or required.
    const reader = request.body?.getReader()
    if (!reader) return response(request, { error: 'Preencha a contribuição.' }, 400)
    const chunks: Uint8Array[] = []; let bytes = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > 20000) { await reader.cancel(); return response(request, { error: 'Contribuição muito longa.' }, 413) }
      chunks.push(value)
    }
    const input = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    const { content, email } = parseBenchSubmission(input)
    const ip = request.headers.get('cf-connecting-ip')
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!ip || !secret) return response(request, { error: 'Envio indisponível agora. Tente novamente mais tarde.' }, 503)
    const digest = (value: string) => createHmac('sha256', secret).update(`bench-contributions:${value}`).digest('hex')
    const { data, error } = await createAdminClient().rpc('submit_bench_contribution', {
      submission_content: content, contact_email: email,
      network_key: digest(`ip:${ip}`), contact_key: digest(`email:${email}`),
    })
    if (error) return response(request, { error: error.message.includes('BENCH_RATE_LIMIT') ? 'Limite de contribuições de hoje atingido. Tente novamente amanhã.' : 'Não conseguimos registrar sua contribuição. Tente novamente.' }, error.message.includes('BENCH_RATE_LIMIT') ? 429 : 503)
    return response(request, { id: data, status: 'pending', message: 'Contribuição recebida para revisão. O conteúdo ainda não está público.' }, 201)
  } catch (error) {
    if (error instanceof BenchValidationError || error instanceof SyntaxError) return response(request, { error: error instanceof BenchValidationError ? error.message : 'Confira os campos e tente novamente.' }, 400)
    return response(request, { error: 'Envio indisponível agora. Seus dados não foram confirmados; tente novamente.' }, 503)
  }
}
