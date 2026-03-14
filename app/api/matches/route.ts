import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const status = req.nextUrl.searchParams.get('status')
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '20', 10), 50)

  let query = supabase
    .from('job_matches')
    .select(`
      *,
      company_job:company_jobs(
        *,
        company:company_profiles(company_name, logo_url, sector, size)
      ),
      crawled_job:jobs(*)
    `)
    .eq('user_id', user.id)
    .order('score', { ascending: false })
    .limit(limit)

  if (status) {
    query = query.eq('status', status)
  }

  const { data: matches, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ matches })
}
