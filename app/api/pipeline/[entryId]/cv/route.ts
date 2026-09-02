import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createPersonalizedCvForEntry } from '@/lib/personalized-cv'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> },
) {
  const { entryId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: entry } = await supabase.from('user_pipeline_entries')
    .select('id, job_id')
    .eq('id', entryId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const cv = await createPersonalizedCvForEntry({
      userId: user.id,
      jobId: entry.job_id,
      pipelineEntryId: entry.id,
    })
    return NextResponse.json({ cv })
  } catch (error) {
    console.error('[pipeline/cv] generation failed:', error)
    return NextResponse.json({ error: 'Could not generate CV' }, { status: 503 })
  }
}
