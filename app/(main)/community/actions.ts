'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { COMMUNITY_CATEGORIES, hasActiveClubAccess } from '@/lib/community'
import { generateClubJobAlerts } from '@/lib/club-job-matching'
import { hasClubProAccess, normalizeLinkedInProfile } from '@/lib/club-membership'

const PROFESSIONAL_TYPES = new Set(['law_firm', 'legal_dept', 'public_sector', 'freelance', 'other'])
const REMOTE_PREFERENCES = new Set(['remote', 'hybrid', 'onsite', 'any'])

function commaSeparatedValues(formData: FormData, field: string, limit: number) {
  return String(formData.get(field) ?? '')
    .split(',')
    .map(value => value.trim().slice(0, 120))
    .filter(Boolean)
    .slice(0, limit)
}

async function getAuthenticatedMember(requirePro = false) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/community')

  const { data: clubAccess } = await supabase
    .from('community_members')
    .select('club_access_status, club_access_expires_at, club_pro_status, club_pro_expires_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!hasActiveClubAccess(clubAccess)) redirect('/club/entrar')
  if (requirePro && !hasClubProAccess(clubAccess)) redirect('/club#pro')

  const { data: profile } = await supabase
    .from('account_profiles')
    .select('full_name, current_role')
    .eq('user_id', user.id)
    .maybeSingle()

  return { supabase, user, profile }
}

export async function createCommunityPost(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()
  const requestedCategory = String(formData.get('category') ?? 'discussao')
  const category = COMMUNITY_CATEGORIES[requestedCategory] ? requestedCategory : 'discussao'

  if (title.length < 3 || title.length > 180 || body.length < 3 || body.length > 10000) return

  const { supabase, user, profile } = await getAuthenticatedMember()
  const fallbackName = user.email?.split('@')[0] || 'Membro LegalOps'

  const { error } = await supabase.from('community_posts').insert({
    author_id: user.id,
    author_name: profile?.full_name?.trim() || fallbackName,
    author_role: profile?.current_role?.trim() || null,
    category,
    title,
    body,
    visibility: 'members',
  })

  if (!error) {
    revalidatePath('/community')
    redirect('/community')
  }
}

export async function confirmBenchAttendance(formData: FormData) {
  const { supabase, user } = await getAuthenticatedMember()
  const eventId = String(formData.get('event_id') ?? '')
  const values = {
    event_id: eventId,
    user_id: user.id,
    response: 'confirmed',
    guest_name: String(formData.get('name') ?? '').trim().slice(0, 120),
    guest_email: String(formData.get('email') ?? '').trim().slice(0, 240),
    guest_role: String(formData.get('role') ?? '').trim().slice(0, 120),
    organization_name: String(formData.get('organization') ?? '').trim().slice(0, 120),
    guest_phone: String(formData.get('phone') ?? '').trim().slice(0, 40) || null,
    dietary_restrictions: String(formData.get('dietary') ?? '').trim().slice(0, 500) || null,
    accessibility_needs: String(formData.get('accessibility') ?? '').trim().slice(0, 500) || null,
    arrival_notes: String(formData.get('notes') ?? '').trim().slice(0, 1000) || null,
    confirmed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  if (!eventId || values.guest_name.length < 2 || values.guest_role.length < 2 || values.organization_name.length < 2 || !values.guest_email.includes('@')) return { ok: false, message: 'Revise os campos obrigatórios.' }
  const { error } = await supabase.from('community_event_rsvps').upsert(values, { onConflict: 'event_id,user_id' })
  if (error) return { ok: false, message: 'Não foi possível salvar agora. Tente novamente.' }
  revalidatePath('/community/calendar')
  return { ok: true, message: 'Presença confirmada. Nos vemos no Bench!' }
}

export async function declineBenchAttendance(formData: FormData) {
  const { supabase, user } = await getAuthenticatedMember()
  const eventId = String(formData.get('event_id') ?? '')
  const { error } = await supabase.from('community_event_rsvps').update({ response: 'declined', confirmed_at: null, updated_at: new Date().toISOString() }).eq('event_id', eventId).eq('user_id', user.id)
  if (error) return { ok: false, message: 'Não foi possível atualizar agora.' }
  revalidatePath('/community/calendar')
  return { ok: true, message: 'Tudo bem — sua resposta foi atualizada.' }
}

export async function toggleCommunityPostLike(formData: FormData) {
  const postId = String(formData.get('post_id') ?? '')
  if (!postId) return

  const { supabase, user } = await getAuthenticatedMember()
  const { data: existing } = await supabase
    .from('community_post_likes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    await supabase.from('community_post_likes').delete().eq('post_id', postId).eq('user_id', user.id)
  } else {
    await supabase.from('community_post_likes').insert({ post_id: postId, user_id: user.id })
  }

  revalidatePath('/community')
}
export async function createCommunityComment(formData: FormData) {
  const postId = String(formData.get('post_id') ?? '')
  const body = String(formData.get('body') ?? '').trim()
  if (!postId || body.length < 1 || body.length > 3000) return

  const { supabase, user, profile } = await getAuthenticatedMember()
  const fallbackName = user.email?.split('@')[0] || 'Membro LegalOps'

  await supabase.from('community_comments').insert({
    post_id: postId,
    author_id: user.id,
    author_name: profile?.full_name?.trim() || fallbackName,
    body,
  })

  revalidatePath('/community')
}

export async function updateCommunityProfile(formData: FormData) {
  const fullName = String(formData.get('full_name') ?? '').trim()
  const currentRole = String(formData.get('current_role') ?? '').trim()
  const headline = String(formData.get('public_headline') ?? '').trim()
  const organizationName = String(formData.get('organization_name') ?? '').trim()
  const organizationDescription = String(formData.get('organization_description') ?? '').trim()
  const bio = String(formData.get('public_bio') ?? '').trim()
  const linkedinUrl = String(formData.get('linkedin_url') ?? '').trim()
  const areasOfExpertise = commaSeparatedValues(formData, 'areas_of_expertise', 10)
  const desiredRoles = commaSeparatedValues(formData, 'desired_roles', 6)
  const preferredLocations = commaSeparatedValues(formData, 'preferred_locations', 8)
  const skills = commaSeparatedValues(formData, 'skills', 15)
  const toolsUsed = commaSeparatedValues(formData, 'tools_used', 15)
  const careerSummary = String(formData.get('career_summary') ?? '').trim()
  const baseCvText = String(formData.get('base_cv_text') ?? '').trim()
  const careerHighlights = String(formData.get('career_highlights') ?? '')
    .split('\n').map(value => value.trim().slice(0, 500)).filter(Boolean).slice(0, 12)
  const professionalType = String(formData.get('professional_type') ?? '')
  const preferredRemote = String(formData.get('preferred_remote') ?? '')
  const openToOpportunities = formData.get('open_to_opportunities') === 'on'
  const jobAlertsEnabled = formData.get('job_alerts_enabled') === 'on'
  const cvSuggestionsEnabled = formData.get('cv_suggestions_enabled') === 'on'
  const isPublic = formData.get('is_public') === 'on'

  if (
    fullName.length < 3 || fullName.length > 120
    || currentRole.length < 2 || currentRole.length > 120
    || headline.length < 3 || headline.length > 160
    || organizationName.length < 2 || organizationName.length > 120
    || organizationDescription.length < 20 || organizationDescription.length > 700
    || bio.length < 20 || bio.length > 1200
    || (careerSummary.length > 0 && careerSummary.length < 20) || careerSummary.length > 3000
    || (baseCvText.length > 0 && baseCvText.length < 50) || baseCvText.length > 30000
    || areasOfExpertise.length === 0
    || !PROFESSIONAL_TYPES.has(professionalType)
    || !REMOTE_PREFERENCES.has(preferredRemote)
  ) redirect('/community/profile?error=fields')

  if (!normalizeLinkedInProfile(linkedinUrl)) redirect('/community/profile?error=fields')

  const { supabase, user } = await getAuthenticatedMember()
  const { error } = await supabase
    .from('account_profiles')
    .update({
      full_name: fullName,
      current_role: currentRole,
      public_headline: headline,
      organization_name: organizationName,
      organization_description: organizationDescription,
      public_bio: bio,
      linkedin_url: normalizeLinkedInProfile(linkedinUrl),
      areas_of_expertise: areasOfExpertise,
      professional_type: professionalType,
      desired_roles: desiredRoles,
      preferred_remote: preferredRemote,
      preferred_locations: preferredLocations,
      skills,
      tools_used: toolsUsed,
      career_summary: careerSummary,
      career_highlights: careerHighlights,
      base_cv_text: baseCvText,
      open_to_opportunities: openToOpportunities,
      job_alerts_enabled: jobAlertsEnabled,
      cv_suggestions_enabled: cvSuggestionsEnabled,
      is_public: isPublic,
    })
    .eq('user_id', user.id)

  if (error) redirect('/community/profile?error=save')

  if (openToOpportunities && jobAlertsEnabled) {
    try {
      await generateClubJobAlerts(user.id)
    } catch (alertError) {
      console.error('[community profile] Could not refresh job alerts:', alertError)
    }
  }

  revalidatePath('/community')
  revalidatePath('/community/profile')
  revalidatePath('/community/members')
  revalidatePath('/community/jobs')
  redirect('/community/profile?saved=1')
}

export async function markClubJobAlertsRead() {
  const { user } = await getAuthenticatedMember(true)
  const admin = createAdminClient()
  const { error } = await admin
    .from('club_job_alerts')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null)

  if (!error) {
    revalidatePath('/community/jobs')
    revalidatePath('/community')
  }
}
