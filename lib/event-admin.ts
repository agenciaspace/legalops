import { createAdminClient } from '@/lib/supabase-admin'
import type { EventWhatsAppSummary, EventWhatsAppSummaryConfig } from '@/lib/event-whatsapp-summary'

type EventRow = {
  id: string
  slug: string
  title: string
}

type RsvpRow = {
  id: string
  user_id: string | null
  response: 'pending' | 'confirmed' | 'declined'
  guest_name: string
  guest_role: string
  organization_name: string
  guest_email: string
  guest_phone: string | null
  dietary_restrictions: string | null
  accessibility_needs: string | null
  arrival_notes: string | null
  confirmed_at: string | null
  created_at: string
}

export type EventAdminClubMember = {
  user_id: string
  display_name: string | null
  current_role: string | null
  organization_name: string | null
  linkedin_url: string | null
  club_access_status: string | null
  profile_verification_status: string | null
  created_at: string
}

export type EventAdminRegistration = Omit<RsvpRow, 'user_id'> & {
  club: EventAdminClubMember | null
}

export type EventAdminOverview = {
  event: EventRow
  registrations: EventAdminRegistration[]
  counts: {
    total: number
    confirmed: number
    declined: number
    pending: number
    clubLinked: number
  }
  whatsapp: {
    config: EventWhatsAppSummaryConfig | null
    summaries: EventWhatsAppSummary[]
  }
}
async function findAuthUsersByEmail(
  admin: ReturnType<typeof createAdminClient>,
  emails: Set<string>,
) {
  const matches = new Map<string, string>()
  if (!emails.size) return matches

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) break
    for (const user of data.users) {
      const email = user.email?.trim().toLowerCase()
      if (email && emails.has(email)) matches.set(email, user.id)
    }
    if (matches.size === emails.size || data.users.length < 1000) break
  }
  return matches
}

export async function loadEventAdminOverview(slug: string): Promise<EventAdminOverview | null> {
  const admin = createAdminClient()
  const { data: event, error: eventError } = await admin
    .from('community_events')
    .select('id,slug,title')
    .eq('slug', slug)
    .maybeSingle()

  if (eventError) throw eventError
  if (!event) return null

  const [registrationsResult, configResult, summariesResult] = await Promise.all([
    admin.from('community_event_rsvps')
      .select('id,user_id,response,guest_name,guest_role,organization_name,guest_email,guest_phone,dietary_restrictions,accessibility_needs,arrival_notes,confirmed_at,created_at')
      .eq('event_id', event.id)
      .order('created_at', { ascending: false }),
    admin.from('community_event_whatsapp_configs')
      .select('enabled,summary_hour_local,time_zone,first_run_at,next_run_at,last_status,last_period_end,last_checked_at')
      .eq('event_id', event.id)
      .maybeSingle(),
    admin.from('community_event_whatsapp_summaries')
      .select('id,event_id,period_start,period_end,title,summary,key_points,source_message_count,source_participant_count,omitted_media_count,published_at,whatsapp_sent_at')
      .eq('event_id', event.id)
      .order('period_end', { ascending: false })
      .limit(30),
  ])

  if (registrationsResult.error) throw registrationsResult.error
  if (configResult.error) throw configResult.error
  if (summariesResult.error) throw summariesResult.error
  const rsvps = (registrationsResult.data ?? []) as RsvpRow[]
  const emails = new Set(rsvps.map(row => row.guest_email.trim().toLowerCase()).filter(Boolean))
  const authUsersByEmail = await findAuthUsersByEmail(admin, emails)
  const linkedUserIds = Array.from(new Set(rsvps
    .map(row => row.user_id || authUsersByEmail.get(row.guest_email.trim().toLowerCase()))
    .filter((value): value is string => Boolean(value))))

  const { data: rawMembers, error: membersError } = linkedUserIds.length
    ? await admin
      .from('community_members')
      .select('user_id,display_name,current_role,organization_name,linkedin_url,club_access_status,profile_verification_status,created_at')
      .in('user_id', linkedUserIds)
    : { data: [], error: null }

  if (membersError) throw membersError
  const members = new Map((rawMembers ?? []).map(member => [member.user_id, member as EventAdminClubMember]))
  const registrations = rsvps.map(row => {
    const matchedUserId = row.user_id || authUsersByEmail.get(row.guest_email.trim().toLowerCase())
    const { user_id: _userId, ...registration } = row
    return { ...registration, club: matchedUserId ? members.get(matchedUserId) ?? null : null }
  })

  return {
    event: event as EventRow,
    registrations,
    counts: {
      total: registrations.length,
      confirmed: registrations.filter(row => row.response === 'confirmed').length,
      declined: registrations.filter(row => row.response === 'declined').length,
      pending: registrations.filter(row => row.response === 'pending').length,
      clubLinked: registrations.filter(row => row.club).length,
    },
    whatsapp: {
      config: configResult.data as EventWhatsAppSummaryConfig | null,
      summaries: (summariesResult.data ?? []) as EventWhatsAppSummary[],
    },
  }
}
