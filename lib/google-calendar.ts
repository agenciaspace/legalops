type CalendarAttendee = {
  email: string
  displayName?: string | null
}

type CalendarEventInput = {
  summary: string
  description: string
  startsAt: string
  endsAt: string
  timeZone: string
  attendees: CalendarAttendee[]
}

type GoogleCalendarEvent = {
  id: string
  htmlLink?: string
  attendees?: CalendarAttendee[]
  conferenceData?: {
    entryPoints?: Array<{ entryPointType?: string; uri?: string }>
  }
}

function calendarConfig() {
  return {
    clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID?.trim(),
    clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET?.trim(),
    refreshToken: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN?.trim(),
    calendarId: process.env.GOOGLE_CALENDAR_ID?.trim() || 'primary',
  }
}

export function isGoogleCalendarConfigured() {
  const config = calendarConfig()
  return Boolean(config.clientId && config.clientSecret && config.refreshToken && config.calendarId)
}

async function getAccessToken() {
  const config = calendarConfig()
  if (!config.clientId || !config.clientSecret || !config.refreshToken) {
    throw new Error('Google Calendar is not configured.')
  }

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: config.refreshToken,
    grant_type: 'refresh_token',
  })

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  })
  const payload = await response.json().catch(() => ({})) as { access_token?: string; error_description?: string }
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || `Google OAuth failed (${response.status}).`)
  }
  return payload.access_token
}

function eventUrl(eventId?: string) {
  const { calendarId } = calendarConfig()
  const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
  return eventId ? `${base}/${encodeURIComponent(eventId)}` : base
}

function meetUrl(event: GoogleCalendarEvent) {
  return event.conferenceData?.entryPoints?.find(point => point.entryPointType === 'video')?.uri ?? null
}

export async function createGoogleMeetEvent(input: CalendarEventInput) {
  if (!isGoogleCalendarConfigured()) throw new Error('Google Calendar is not configured.')
  const accessToken = await getAccessToken()
  const requestId = `legalops-bench-${crypto.randomUUID()}`

  const response = await fetch(`${eventUrl()}?conferenceDataVersion=1&sendUpdates=all`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.startsAt, timeZone: input.timeZone },
      end: { dateTime: input.endsAt, timeZone: input.timeZone },
      attendees: input.attendees.map(attendee => ({
        email: attendee.email,
        ...(attendee.displayName ? { displayName: attendee.displayName } : {}),
      })),
      conferenceData: {
        createRequest: {
          requestId,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
      guestsCanInviteOthers: false,
      guestsCanModify: false,
      guestsCanSeeOtherGuests: true,
    }),
    cache: 'no-store',
  })

  const payload = await response.json().catch(() => ({})) as GoogleCalendarEvent & { error?: { message?: string } }
  if (!response.ok || !payload.id) {
    throw new Error(payload.error?.message || `Google Calendar event creation failed (${response.status}).`)
  }

  return {
    eventId: payload.id,
    meetingUrl: meetUrl(payload),
    htmlLink: payload.htmlLink ?? null,
  }
}

export async function addGoogleEventAttendee(eventId: string, attendee: CalendarAttendee) {
  if (!isGoogleCalendarConfigured()) throw new Error('Google Calendar is not configured.')
  const accessToken = await getAccessToken()

  const currentResponse = await fetch(eventUrl(eventId), {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })
  const current = await currentResponse.json().catch(() => ({})) as GoogleCalendarEvent & { error?: { message?: string } }
  if (!currentResponse.ok) {
    throw new Error(current.error?.message || `Could not read Google Calendar event (${currentResponse.status}).`)
  }

  const normalizedEmail = attendee.email.trim().toLowerCase()
  const attendees = [...(current.attendees ?? [])]
  if (!attendees.some(item => item.email?.trim().toLowerCase() === normalizedEmail)) {
    attendees.push({ email: normalizedEmail, ...(attendee.displayName ? { displayName: attendee.displayName } : {}) })
  }

  const response = await fetch(`${eventUrl(eventId)}?sendUpdates=all&conferenceDataVersion=1`, {
    method: 'PATCH',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ attendees }),
    cache: 'no-store',
  })
  const payload = await response.json().catch(() => ({})) as GoogleCalendarEvent & { error?: { message?: string } }
  if (!response.ok) {
    throw new Error(payload.error?.message || `Could not add attendee to Google Calendar (${response.status}).`)
  }

  return { meetingUrl: meetUrl(payload) }
}
