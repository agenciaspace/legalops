import { laboratory } from './laboratory'

export function GET() {
  return new Response(laboratory, { headers: {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': "default-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'unsafe-inline'; font-src 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    'Referrer-Policy': 'no-referrer',
  } })
}
