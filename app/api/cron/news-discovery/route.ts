import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { newsCronAuthorized } from '@/lib/news-http'
import { NEWS_SOURCE_DOMAINS, newsCandidateFromSearch } from '@/lib/news-discovery'

export const maxDuration = 60
export async function GET(request: NextRequest) {
  if (!newsCronAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const key = process.env.FIRECRAWL_API_KEY
  if (!key) return NextResponse.json({ error: 'discovery_not_configured' }, { status: 503 })
  try {
    const response = await fetch('https://api.firecrawl.dev/v2/search', {
      method: 'POST', signal: AbortSignal.timeout(35000), headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '(legal AI OR legal operations OR tecnologia jurídica OR contratos) (launch OR partnership OR report OR lançamento OR integração)', sources: ['web'], includeDomains: NEWS_SOURCE_DOMAINS, tbs: 'qdr:w', limit: 15, timeout: 30000 }),
    })
    if (!response.ok) throw new Error('discovery_provider_unavailable')
    const result = await response.json() as { success?: boolean; data?: { web?: unknown[] } }
    if (!result.success || !Array.isArray(result.data?.web)) throw new Error('discovery_invalid_response')
    const candidates = result.data.web.map(newsCandidateFromSearch).filter((item): item is NonNullable<typeof item> => item !== null)
    if (!candidates.length) return NextResponse.json({ discovered: 0, published: 0 })
    const { error } = await createAdminClient().from('news_candidates').upsert(candidates, { onConflict: 'url', ignoreDuplicates: true })
    if (error) throw new Error('discovery_save_failed')
    return NextResponse.json({ discovered: candidates.length, published: 0, status: 'awaiting_editorial_review' })
  } catch { return NextResponse.json({ error: 'discovery_unavailable', published: 0 }, { status: 503 }) }
}
