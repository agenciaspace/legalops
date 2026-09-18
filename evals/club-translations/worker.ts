// Authenticated, expiring preview only. Never deploy this entrypoint to traffic.
import { translateClubPayload } from '../../lib/club-translation-model'
export default {
  async fetch(request: Request, env: { OPENROUTER_API_KEY: string; EVAL_TOKEN_SHA256: string; EVAL_EXPIRES_AT: string }) {
    const token = (request.headers.get('authorization') ?? '').replace(/^Bearer /, '')
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))).map(v => v.toString(16).padStart(2, '0')).join('')
    if (!env.EVAL_TOKEN_SHA256 || Date.now() > Number(env.EVAL_EXPIRES_AT) || digest !== env.EVAL_TOKEN_SHA256) return new Response('Not found', { status: 404 })
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
    const body = await request.json() as { payload: Record<string, string | string[] | null>; locale?: string }
    if (!body.payload || JSON.stringify(body.payload).length > 20000) return new Response('Invalid input', { status: 400 })
    try { return Response.json(await translateClubPayload(body.payload, body.locale ?? null, env.OPENROUTER_API_KEY)) }
    catch (error) { return Response.json({ error: (error as Error).message }, { status: 502 }) }
  },
}
