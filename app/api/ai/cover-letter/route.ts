import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withCreditAction } from '@/lib/club-credits'
import { creditFailureResponse, validCreditOrigin } from '@/lib/club-credit-response'

export async function POST(req: NextRequest) {
  if(!validCreditOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403})
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { entry_id, user_background } = await req.json()
  if (!entry_id) return NextResponse.json({ error: 'entry_id required' }, { status: 400 })

  const { data: entry } = await supabase
    .from('user_pipeline_entries')
    .select('*, job:jobs(*)')
    .eq('id', entry_id)
    .eq('user_id', user.id)
    .single()

  if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 })

  const job = entry.job as { title: string; company: string; raw_description: string }

  const backgroundContext = user_background
    ? `\n\nInformacoes do candidato:\n${user_background}`
    : ''

  try {
    const text = await withCreditAction(user.id,'cover_letter',generate=>generate({
      systemPrompt: 'You are an expert career coach. Write polished Portuguese (BR) application materials with no extra commentary.',
      userPrompt: `Write a professional cover letter in Portuguese (BR) for this Legal Operations job.

Job Title: ${job.title}
Company: ${job.company}
Description: ${job.raw_description.slice(0, 3000)}${backgroundContext}

Write a compelling cover letter that:
- Is concise (3-4 paragraphs)
- Highlights relevant experience for Legal Operations
- Shows genuine interest in the company
- Demonstrates knowledge of the industry
- Has a confident but not arrogant tone
- Is ready to copy and paste

Only output the cover letter text, no extra commentary.`,
      maxTokens: 2000,
      temperature: 0.4,
    }))

    return NextResponse.json({ letter: text })
  } catch (error) {
    return creditFailureResponse(error,req)
  }
}
