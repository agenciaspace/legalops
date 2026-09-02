import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { hasActiveClubAccess } from '@/lib/community'
import { isCandidateProfileReady, normalizeCandidateProfilePatch } from '@/lib/candidate-profile'
import { generateClubJobAlerts } from '@/lib/club-job-matching'

async function getActiveClubUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { data: access } = await supabase.from('community_members')
    .select('club_access_status, club_access_expires_at')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!hasActiveClubAccess(access)) {
    return { supabase, user: null, error: NextResponse.json({ error: 'Active Club membership required' }, { status: 403 }) }
  }
  return { supabase, user, error: null }
}

export async function GET() {
  const { supabase, user, error: accessError } = await getActiveClubUser()
  if (accessError || !user) return accessError

  const { data, error } = await supabase
    .from('account_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}

export async function PATCH(req: NextRequest) {
  const { supabase, user, error: accessError } = await getActiveClubUser()
  if (accessError || !user) return accessError

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  const allowed = normalizeCandidateProfilePatch(body as Record<string, unknown>)

  if (body.onboarding_completed === false) allowed.onboarding_completed = false

  if (body.onboarding_completed === true) {
    const { data: current, error: currentError } = await supabase.from('account_profiles')
      .select('full_name, current_role, desired_roles, areas_of_expertise, career_summary, base_cv_text')
      .eq('user_id', user.id)
      .single()
    if (currentError) return NextResponse.json({ error: currentError.message }, { status: 500 })
    const merged = { ...current, ...allowed }
    if (!isCandidateProfileReady(merged)) {
      return NextResponse.json({
        error: 'Complete nome, cargo atual, cargos desejados, especialidades, resumo e CV base antes de continuar.',
      }, { status: 422 })
    }
    allowed.onboarding_completed = true
    allowed.profile_completed_at = new Date().toISOString()
    allowed.open_to_opportunities = true
    allowed.job_alerts_enabled = true
    allowed.cv_suggestions_enabled = true
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

  if (data.onboarding_completed && data.open_to_opportunities && data.job_alerts_enabled) {
    try {
      await generateClubJobAlerts(user.id)
    } catch (alertError) {
      console.error('[profile] Could not refresh personalized job alerts:', alertError)
    }
  }
  return NextResponse.json({ profile: data })
}
