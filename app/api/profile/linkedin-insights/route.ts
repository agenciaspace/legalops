import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { withCreditAction } from '@/lib/club-credits'
import { creditFailureResponse, validCreditOrigin } from '@/lib/club-credit-response'
import { generateLinkedInInsights } from '@/lib/linkedin-insights'
import type { ProfessionalType } from '@/lib/types'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  if(!validCreditOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403})
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const linkedinUrl: string = typeof body.linkedin_url === 'string' ? body.linkedin_url.trim() : ''

  if (!linkedinUrl || !linkedinUrl.includes('linkedin.com')) {
    return NextResponse.json({ error: 'URL do LinkedIn inválida' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('account_profiles')
    .select('current_role, professional_type, years_experience, areas_of_expertise')
    .eq('user_id', user.id)
    .single()

  try {
  return await withCreditAction(user.id,'linkedin_insights',async generate=>{
  const { insights, rawText } = await generateLinkedInInsights({
    generate,
    linkedinUrl,
    currentRole: profile?.current_role ?? null,
    professionalType: (profile?.professional_type as ProfessionalType) ?? null,
    yearsExperience: profile?.years_experience ?? null,
    areasOfExpertise: profile?.areas_of_expertise ?? [],
  })

  const linkedinData = {
    scraped_at: new Date().toISOString(),
    raw_text: rawText || null,
    insights,
  }

  const {error:saveError}=await supabase
    .from('account_profiles')
    .update({ linkedin_url: linkedinUrl, linkedin_data: linkedinData })
    .eq('user_id', user.id)

  if(saveError)throw new Error('Could not save profile insights')
  return NextResponse.json({ insights, scraped: !!rawText })
  })
  } catch(error){return creditFailureResponse(error,req)}
}
