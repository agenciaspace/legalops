import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import type { ProfessionalType } from '@/lib/types'

const VALID_PROFESSIONAL_TYPES = new Set<ProfessionalType>([
  'law_firm', 'legal_dept', 'public_sector', 'freelance', 'other',
])

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('account_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const allowed: Record<string, unknown> = {}

  if (typeof body.full_name === 'string') allowed.full_name = body.full_name.trim()
  if (typeof body.current_role === 'string') allowed.current_role = body.current_role.trim()
  if (
    typeof body.professional_type === 'string' &&
    VALID_PROFESSIONAL_TYPES.has(body.professional_type as ProfessionalType)
  ) {
    allowed.professional_type = body.professional_type
  }
  if (typeof body.years_experience === 'number' && body.years_experience >= 0) {
    allowed.years_experience = body.years_experience
  }
  if (Array.isArray(body.areas_of_expertise)) {
    allowed.areas_of_expertise = body.areas_of_expertise.filter(
      (a: unknown) => typeof a === 'string'
    )
  }
  if (typeof body.linkedin_url === 'string') {
    allowed.linkedin_url = body.linkedin_url.trim() || null
  }
  if (body.linkedin_data !== undefined) {
    allowed.linkedin_data = body.linkedin_data
  }
  if (typeof body.onboarding_completed === 'boolean') {
    allowed.onboarding_completed = body.onboarding_completed
  }

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('account_profiles')
    .update(allowed)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}
