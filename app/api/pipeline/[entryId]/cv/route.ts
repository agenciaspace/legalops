import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { MEMBER_OPENAI_MODEL } from '@/lib/club-api-key'
import { withCreditAction } from '@/lib/club-credits'
import { creditFailureResponse, validCreditOrigin } from '@/lib/club-credit-response'
import { createPersonalizedCvForEntry } from '@/lib/personalized-cv'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> },
) {
  if(!validCreditOrigin(_request))return NextResponse.json({error:'Invalid origin'},{status:403})
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
    const cv = await withCreditAction(user.id,'personalized_cv',(generate,reservation)=>createPersonalizedCvForEntry({
      generate, model:reservation.funding==='api'?MEMBER_OPENAI_MODEL:undefined,
      userId: user.id,
      jobId: entry.job_id,
      pipelineEntryId: entry.id,
    }))
    return NextResponse.json({ cv })
  } catch (error) {
    return creditFailureResponse(error,_request)
  }
}
