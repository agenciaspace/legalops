import { NextRequest } from 'next/server'
import { timingSafeEqual } from 'node:crypto'

export function newsSameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  return Boolean(origin && origin === request.nextUrl.origin && request.headers.get('sec-fetch-site') !== 'cross-site')
}
export async function readNewsJson(request: NextRequest, limit = 12000) {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new Error('Formato inválido.')
  const reader = request.body?.getReader()
  if (!reader) throw new Error('Preencha os campos.')
  const chunks: Uint8Array[] = []
  let bytes = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    bytes += value.byteLength
    if (bytes > limit) { await reader.cancel(); throw new Error('Conteúdo muito longo.') }
    chunks.push(value)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
}
export function newsCronAuthorized(request: NextRequest) {
  const expected = process.env.CRON_SECRET
  const actual = request.headers.get('authorization') ?? ''
  if (!expected || !actual.startsWith('Bearer ')) return false
  const a = Buffer.from(actual.slice(7)), b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
