import type { PublicEvent } from '@/lib/public-events'

const PUBLIC_EVENT_COLUMNS = 'id,slug,title,description,host_name,starts_at,ends_at,location_label,event_type,is_published,participation_mode,participation_details,pre_questions'

export async function loadLivePublicEvent(slug: string): Promise<PublicEvent | null> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!baseUrl || !key) return null
  const query = new URLSearchParams({
    select: PUBLIC_EVENT_COLUMNS,
    slug: `eq.${slug}`,
    is_published: 'eq.true',
    limit: '1',
  })
  try {
    const response = await fetch(`${baseUrl}/rest/v1/community_events?${query}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(3_500),
    })
    if (!response.ok) return null
    const rows = await response.json() as unknown
    return Array.isArray(rows) && rows.length === 1 ? rows[0] as PublicEvent : null
  } catch {
    return null
  }
}
