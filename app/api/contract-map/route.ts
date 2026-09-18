import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'
const headers = { 'Access-Control-Allow-Origin': 'https://legalops.dev', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Cache-Control': 'public, max-age=0, s-maxage=30' }
export function OPTIONS() { return new NextResponse(null, { status: 204, headers }) }
export async function GET() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
  const { data, error } = await db.from('contract_map_sections').select('id,title,position,content,version,updated_at,journey').eq('journey', 'clm-migration').order('position')
  if (error) return NextResponse.json({ error: 'Mapa indisponível. Tente novamente.' }, { status: 503, headers: { ...headers, 'Cache-Control': 'no-store' } })
  return NextResponse.json({ title: 'Migração de CLM', journey: 'clm-migration', sections: data, license: 'MIT' }, { headers })
}
