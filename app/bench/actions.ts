'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-admin'
import { addGoogleEventAttendee, createGoogleMeetEvent, isGoogleCalendarConfigured } from '@/lib/google-calendar'
import { requireCommunityManager, requireLegalOpsAdmin } from '@/lib/legalops-admin'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const REGION_STATUSES = new Set(['forming', 'active', 'paused', 'archived'])
const LEADER_ROLES = new Set(['lead', 'co_lead', 'organizer'])
const LEADER_DECISIONS = new Set(['active', 'declined', 'paused'])

function clean(value: FormDataEntryValue | null, max = 500) {
  return String(value ?? '').trim().slice(0, max)
}

function normalizeEmail(value: FormDataEntryValue | null) {
  return clean(value, 254).toLowerCase()
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
}

function localDateTimeToIso(value: string, timeZone: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/)
  if (!match) throw new Error('Invalid local date/time.')
  const [, year, month, day, hour, minute] = match
  const target = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), 0)
  let guess = target
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23',
  })

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date(guess))
        .filter(part => part.type !== 'literal')
        .map(part => [part.type, part.value])
    )
    const observed = Date.UTC(
      Number(parts.year), Number(parts.month) - 1, Number(parts.day),
      Number(parts.hour), Number(parts.minute), Number(parts.second)
    )
    const delta = target - observed
    guess += delta
    if (delta === 0) break
  }
  return new Date(guess).toISOString()
}

async function nextScheduledSession(topicId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('bench_sessions')
    .select('id, capacity, google_event_id, starts_at, ends_at, status')
    .eq('topic_id', topicId)
    .eq('status', 'scheduled')
    .gte('ends_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  return data
}

export async function registerBenchInterest(formData: FormData) {
  const topicId = clean(formData.get('topic_id'), 80)
  const fullName = clean(formData.get('full_name'), 120)
  const email = normalizeEmail(formData.get('email'))
  const organization = clean(formData.get('organization'), 120)
  const currentRole = clean(formData.get('current_role'), 120)

  if (!topicId || fullName.length < 2 || !EMAIL_RE.test(email)) return

  const admin = createAdminClient()
  const { data: topic } = await admin
    .from('bench_topics')
    .select('id, slug, status, is_public')
    .eq('id', topicId)
    .maybeSingle()
  if (!topic?.is_public || topic.status === 'archived') return

  const session = await nextScheduledSession(topic.id)
  const { data: existing } = await admin
    .from('bench_registrations')
    .select('id, status, calendar_invite_status, session_id')
    .eq('topic_id', topic.id)
    .eq('email', email)
    .maybeSingle()

  let status: 'interested' | 'registered' | 'waitlist' = 'interested'
  let sessionId: string | null = null

  if (session) {
    sessionId = session.id
    if (existing?.status === 'registered' && existing.session_id === session.id) {
      status = 'registered'
    } else if (session.capacity) {
      const { count } = await admin
        .from('bench_registrations')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', session.id)
        .eq('status', 'registered')
      status = (count ?? 0) >= session.capacity ? 'waitlist' : 'registered'
    } else {
      status = 'registered'
    }
  }

  const payload = {
    topic_id: topic.id,
    session_id: sessionId,
    full_name: fullName,
    email,
    organization: organization || null,
    current_role: currentRole || null,
    status,
    calendar_invite_status: status === 'registered' ? 'pending' : 'not_required',
    updated_at: new Date().toISOString(),
  }

  let registrationId = existing?.id as string | undefined
  if (registrationId) {
    await admin.from('bench_registrations').update(payload).eq('id', registrationId)
  } else {
    const { data: created } = await admin
      .from('bench_registrations')
      .insert(payload)
      .select('id')
      .single()
    registrationId = created?.id
  }

  let calendarError = false
  if (
    registrationId
    && session?.google_event_id
    && status === 'registered'
    && existing?.calendar_invite_status !== 'sent'
  ) {
    try {
      await addGoogleEventAttendee(session.google_event_id, { email, displayName: fullName })
      await admin
        .from('bench_registrations')
        .update({
          calendar_invite_status: 'sent',
          calendar_invited_at: new Date().toISOString(),
          calendar_invite_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', registrationId)
    } catch (error) {
      calendarError = true
      await admin
        .from('bench_registrations')
        .update({
          calendar_invite_status: 'error',
          calendar_invite_error: error instanceof Error ? error.message.slice(0, 500) : 'Calendar sync failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', registrationId)
    }
  }

  revalidatePath('/bench')
  revalidatePath(`/bench/${topic.slug}`)
  const outcome = status === 'waitlist' ? 'waitlist' : status === 'registered' ? 'registered' : 'interested'
  redirect(`/bench/${topic.slug}?${outcome}=1${calendarError ? '&calendar=error' : ''}`)
}

export async function submitBenchSuggestion(formData: FormData) {
  const title = clean(formData.get('title'), 180)
  const context = clean(formData.get('context'), 2000)
  const fullName = clean(formData.get('full_name'), 120)
  const email = normalizeEmail(formData.get('email'))
  const organization = clean(formData.get('organization'), 120)
  const regionId = clean(formData.get('region_id'), 80)
  if (title.length < 3 || fullName.length < 2 || !EMAIL_RE.test(email)) return

  const admin = createAdminClient()
  await admin.from('bench_topic_suggestions').insert({
    title,
    context,
    full_name: fullName,
    email,
    organization: organization || null,
    region_id: regionId || null,
  })
  redirect('/bench?suggested=1')
}

export async function applyRegionalLeadership(formData: FormData) {
  const regionId = clean(formData.get('region_id'), 80)
  const displayName = clean(formData.get('display_name'), 120)
  const email = normalizeEmail(formData.get('email'))
  const title = clean(formData.get('title'), 120)
  const organization = clean(formData.get('organization'), 120)
  const linkedinUrl = clean(formData.get('linkedin_url'), 300)
  const motivation = clean(formData.get('motivation'), 2000)
  const roleInput = clean(formData.get('role'), 30)
  const role = LEADER_ROLES.has(roleInput) ? roleInput : 'co_lead'

  if (!regionId || displayName.length < 2 || !EMAIL_RE.test(email) || motivation.length < 10) return
  if (linkedinUrl && !/^https:\/\/(www\.)?linkedin\.com\//i.test(linkedinUrl)) return

  const admin = createAdminClient()
  const { data: region } = await admin
    .from('community_regions')
    .select('id, slug')
    .eq('id', regionId)
    .eq('is_public', true)
    .maybeSingle()
  if (!region) return

  const { data: existing } = await admin
    .from('community_regional_leaders')
    .select('id, status')
    .eq('region_id', region.id)
    .eq('email', email)
    .maybeSingle()

  const payload = {
    display_name: displayName,
    email,
    title: title || null,
    organization: organization || null,
    linkedin_url: linkedinUrl || null,
    motivation,
    role,
    status: existing?.status === 'active' ? 'active' : 'pending',
    updated_at: new Date().toISOString(),
  }
  if (existing?.id) {
    await admin.from('community_regional_leaders').update(payload).eq('id', existing.id)
  } else {
    await admin.from('community_regional_leaders').insert({ region_id: region.id, ...payload })
  }

  revalidatePath('/regions')
  redirect(`/regions?applied=${encodeURIComponent(region.slug)}`)
}

export async function createBenchTopic(formData: FormData) {
  const manager = await requireCommunityManager('/bench/manage')
  const title = clean(formData.get('title'), 180)
  const description = clean(formData.get('description'), 3000)
  const category = clean(formData.get('category'), 80) || 'geral'
  const regionId = clean(formData.get('region_id'), 80)
  const minimum = Math.max(2, Math.min(100, Number(formData.get('min_participants') || 5)))
  const ideal = Math.max(minimum, Math.min(250, Number(formData.get('ideal_participants') || 12)))
  if (title.length < 3 || description.length < 10) return
  if (!manager.isAdmin && (!regionId || !manager.managedRegionIds.has(regionId))) return

  let slug = slugify(title)
  if (regionId) {
    const { data: region } = await manager.admin.from('community_regions').select('slug').eq('id', regionId).maybeSingle()
    if (!region) return
    slug = `${region.slug}-${slug}`.slice(0, 110)
  }

  const { data: existing } = await manager.admin.from('bench_topics').select('id').eq('slug', slug).maybeSingle()
  if (existing) slug = `${slug}-${Date.now().toString(36)}`

  await manager.admin.from('bench_topics').insert({
    slug,
    title,
    description,
    category,
    region_id: regionId || null,
    min_participants: minimum,
    ideal_participants: ideal,
    created_by: manager.user.id,
  })
  revalidatePath('/bench')
  revalidatePath('/bench/manage')
  redirect('/bench/manage?created=1')
}

export async function scheduleBench(formData: FormData) {
  const manager = await requireCommunityManager('/bench/manage')
  const topicId = clean(formData.get('topic_id'), 80)
  const localStartsAt = clean(formData.get('starts_at'), 30)
  const duration = Math.max(20, Math.min(180, Number(formData.get('duration_minutes') || 60)))
  const capacityInput = Number(formData.get('capacity') || 0)
  const capacity = capacityInput > 0 ? Math.min(250, capacityInput) : null

  const { data: topic } = await manager.admin
    .from('bench_topics')
    .select('id, slug, title, description, region_id')
    .eq('id', topicId)
    .maybeSingle()
  if (!topic) return
  if (!manager.isAdmin && (!topic.region_id || !manager.managedRegionIds.has(topic.region_id))) return

  let timeZone = 'America/Sao_Paulo'
  if (topic.region_id) {
    const { data: region } = await manager.admin
      .from('community_regions')
      .select('timezone, name')
      .eq('id', topic.region_id)
      .maybeSingle()
    timeZone = region?.timezone || timeZone
  }

  let startsAt: string
  try {
    startsAt = localDateTimeToIso(localStartsAt, timeZone)
  } catch {
    redirect('/bench/manage?schedule=invalid-date')
  }
  const endsAt = new Date(new Date(startsAt).getTime() + duration * 60_000).toISOString()

  const { data: registrations } = await manager.admin
    .from('bench_registrations')
    .select('id, email, full_name, status')
    .eq('topic_id', topic.id)
    .neq('status', 'canceled')
    .order('created_at', { ascending: true })

  const eligible = registrations ?? []
  const selected = capacity ? eligible.slice(0, capacity) : eligible
  const waitlist = capacity ? eligible.slice(capacity) : []

  const { data: session } = await manager.admin
    .from('bench_sessions')
    .insert({
      topic_id: topic.id,
      starts_at: startsAt,
      ends_at: endsAt,
      timezone: timeZone,
      capacity,
      status: 'draft',
      calendar_sync_status: isGoogleCalendarConfigured() ? 'pending' : 'not_configured',
      created_by: manager.user.id,
    })
    .select('id')
    .single()
  if (!session) return

  if (!isGoogleCalendarConfigured()) {
    await manager.admin
      .from('bench_sessions')
      .update({ calendar_sync_error: 'Google Calendar credentials are not configured.', updated_at: new Date().toISOString() })
      .eq('id', session.id)
    redirect('/bench/manage?calendar=not-configured')
  }

  try {
    const event = await createGoogleMeetEvent({
      summary: `legalops.club bench — ${topic.title}`,
      description: `${topic.description}\n\nBench gratuito da comunidade legalops.club. Troca prática entre profissionais de Legal e Legal Ops; sem pitch comercial.`,
      startsAt,
      endsAt,
      timeZone,
      attendees: selected.map(registration => ({ email: registration.email, displayName: registration.full_name })),
    })

    await manager.admin
      .from('bench_sessions')
      .update({
        google_event_id: event.eventId,
        meeting_url: event.meetingUrl,
        status: 'scheduled',
        calendar_sync_status: 'synced',
        calendar_sync_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.id)

    await Promise.all([
      ...selected.map(registration => manager.admin
        .from('bench_registrations')
        .update({
          session_id: session.id,
          status: 'registered',
          calendar_invite_status: 'sent',
          calendar_invited_at: new Date().toISOString(),
          calendar_invite_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', registration.id)),
      ...waitlist.map(registration => manager.admin
        .from('bench_registrations')
        .update({
          session_id: session.id,
          status: 'waitlist',
          calendar_invite_status: 'not_required',
          updated_at: new Date().toISOString(),
        })
        .eq('id', registration.id)),
    ])

    await manager.admin
      .from('bench_topics')
      .update({ status: 'scheduled', updated_at: new Date().toISOString() })
      .eq('id', topic.id)
  } catch (error) {
    await manager.admin
      .from('bench_sessions')
      .update({
        status: 'draft',
        calendar_sync_status: 'error',
        calendar_sync_error: error instanceof Error ? error.message.slice(0, 500) : 'Calendar sync failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.id)
    redirect('/bench/manage?calendar=error')
  }

  revalidatePath('/bench')
  revalidatePath(`/bench/${topic.slug}`)
  revalidatePath('/bench/manage')
  redirect(`/bench/manage?scheduled=${encodeURIComponent(topic.slug)}`)
}

export async function createCommunityRegion(formData: FormData) {
  const manager = await requireLegalOpsAdmin('/regions/manage')
  const name = clean(formData.get('name'), 120)
  const stateCode = clean(formData.get('state_code'), 4).toUpperCase()
  const macroRegion = clean(formData.get('macro_region'), 80)
  const typeInput = clean(formData.get('region_type'), 30)
  const regionType = new Set(['country', 'macroregion', 'state', 'city', 'metro']).has(typeInput) ? typeInput : 'city'
  const timezone = clean(formData.get('timezone'), 80) || 'America/Sao_Paulo'
  if (name.length < 2) return

  let slug = slugify(name)
  const { data: duplicate } = await manager.admin.from('community_regions').select('id').eq('slug', slug).maybeSingle()
  if (duplicate) slug = `${slug}-${stateCode.toLowerCase() || Date.now().toString(36)}`

  await manager.admin.from('community_regions').insert({
    slug,
    name,
    state_code: stateCode || null,
    macro_region: macroRegion || null,
    region_type: regionType,
    timezone,
    status: 'forming',
  })
  revalidatePath('/regions')
  revalidatePath('/regions/manage')
  redirect('/regions/manage?region-created=1')
}

export async function updateCommunityRegion(formData: FormData) {
  const manager = await requireCommunityManager('/regions/manage')
  const regionId = clean(formData.get('region_id'), 80)
  if (!regionId || (!manager.isAdmin && !manager.managedRegionIds.has(regionId))) return

  const description = clean(formData.get('description'), 2000)
  const whatsappUrl = clean(formData.get('whatsapp_url'), 500)
  const meetingCadence = clean(formData.get('meeting_cadence'), 160)
  const requestedStatus = clean(formData.get('status'), 30)
  const status = REGION_STATUSES.has(requestedStatus) ? requestedStatus : 'forming'
  if (whatsappUrl && !/^https:\/\/(chat\.whatsapp\.com|wa\.me)\//i.test(whatsappUrl)) return

  await manager.admin
    .from('community_regions')
    .update({
      description: description || null,
      whatsapp_url: whatsappUrl || null,
      meeting_cadence: meetingCadence || null,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', regionId)
  revalidatePath('/regions')
  revalidatePath('/regions/manage')
  redirect('/regions/manage?saved=1')
}

export async function reviewLeadershipApplication(formData: FormData) {
  const manager = await requireLegalOpsAdmin('/regions/manage')
  const leadershipId = clean(formData.get('leadership_id'), 80)
  const decisionInput = clean(formData.get('decision'), 30)
  if (!leadershipId || !LEADER_DECISIONS.has(decisionInput)) return

  const approved = decisionInput === 'active'
  await manager.admin
    .from('community_regional_leaders')
    .update({
      status: decisionInput,
      approved_at: approved ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadershipId)
  revalidatePath('/regions')
  revalidatePath('/regions/manage')
  redirect(`/regions/manage?leadership=${decisionInput}`)
}
