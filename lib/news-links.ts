import { headers } from 'next/headers'

export function newsBasePath() {
  const host = (headers().get('x-forwarded-host') || headers().get('host') || '').split(',')[0].trim().split(':')[0]
  return host === 'legalops.news' || host === 'www.legalops.news' ? '' : '/news'
}
