import {
  getGoogleWorkspaceAccessToken,
  isGoogleWorkspaceConfigured,
} from "@/lib/google-workspace";

type CalendarAttendee = {
  email: string;
  displayName?: string | null;
};

type CalendarEventInput = {
  summary: string;
  description: string;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  attendees: CalendarAttendee[];
  googleEventId?: string | null;
  localEventId?: string;
  createConference?: boolean;
  location?: string | null;
};

type GoogleCalendarEvent = {
  id: string;
  htmlLink?: string;
  attendees?: CalendarAttendee[];
  conferenceData?: {
    entryPoints?: Array<{ entryPointType?: string; uri?: string }>;
    createRequest?: { status?: { statusCode?: string } };
  };
};

function calendarConfig() {
  return {
    calendarId: process.env.GOOGLE_CALENDAR_ID?.trim() || "primary",
  };
}

export function googleCalendarEventLink(eventId?: string | null) {
  if (!eventId) return null;
  const { calendarId } = calendarConfig();
  const value = `${eventId} ${calendarId}`;
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of Array.from(bytes)) binary += String.fromCharCode(byte);
  const eid = btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return `https://www.google.com/calendar/event?eid=${eid}`;
}

export function isGoogleCalendarConfigured() {
  const config = calendarConfig();
  return Boolean(isGoogleWorkspaceConfigured() && config.calendarId);
}

export function googleCalendarOrganizerEmail() {
  return (
    process.env.GOOGLE_CALENDAR_ORGANIZER_EMAIL?.trim() || "hi@legalops.club"
  );
}

function eventUrl(eventId?: string) {
  const { calendarId } = calendarConfig();
  const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
  return eventId ? `${base}/${encodeURIComponent(eventId)}` : base;
}

function meetUrl(event: GoogleCalendarEvent) {
  return (
    event.conferenceData?.entryPoints?.find(
      (point) => point.entryPointType === "video",
    )?.uri ?? null
  );
}

async function readGoogleEvent(accessToken: string, eventId: string) {
  const response = await fetch(`${eventUrl(eventId)}?conferenceDataVersion=1`, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (response.status === 404) return null;
  const payload = (await response
    .json()
    .catch(() => ({}))) as GoogleCalendarEvent & {
    error?: { message?: string };
  };
  if (!response.ok)
    throw new Error(
      payload.error?.message ||
        `Could not read Google Calendar event (${response.status}).`,
    );
  return payload;
}

async function waitForMeet(accessToken: string, event: GoogleCalendarEvent) {
  let current = event;
  for (
    let attempt = 0;
    attempt < 5 &&
    !meetUrl(current) &&
    current.conferenceData?.createRequest?.status?.statusCode === "pending";
    attempt += 1
  ) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    current = (await readGoogleEvent(accessToken, current.id)) ?? current;
  }
  return current;
}

function deterministicGoogleEventId(localEventId?: string) {
  return localEventId
    ? `legalops${localEventId.replace(/-/g, "").toLowerCase()}`
    : undefined;
}

export async function createGoogleMeetEvent(input: CalendarEventInput) {
  if (!isGoogleCalendarConfigured())
    throw new Error("Google Calendar is not configured.");
  const accessToken = await getGoogleWorkspaceAccessToken();
  const requestId = `legalops-bench-${crypto.randomUUID()}`;

  const response = await fetch(
    `${eventUrl()}?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        summary: input.summary,
        description: input.description,
        start: { dateTime: input.startsAt, timeZone: input.timeZone },
        end: { dateTime: input.endsAt, timeZone: input.timeZone },
        attendees: input.attendees.map((attendee) => ({
          email: attendee.email,
          ...(attendee.displayName
            ? { displayName: attendee.displayName }
            : {}),
        })),
        ...(input.location ? { location: input.location } : {}),
        conferenceData: {
          createRequest: {
            requestId,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
        guestsCanInviteOthers: false,
        guestsCanModify: false,
        guestsCanSeeOtherGuests: true,
      }),
      cache: "no-store",
    },
  );

  const payload = (await response
    .json()
    .catch(() => ({}))) as GoogleCalendarEvent & {
    error?: { message?: string };
  };
  if (!response.ok || !payload.id) {
    throw new Error(
      payload.error?.message ||
        `Google Calendar event creation failed (${response.status}).`,
    );
  }

  return {
    eventId: payload.id,
    meetingUrl: meetUrl(payload),
    htmlLink: payload.htmlLink ?? googleCalendarEventLink(payload.id),
  };
}

export async function upsertGoogleMeetEvent(input: CalendarEventInput) {
  if (!isGoogleCalendarConfigured())
    throw new Error("Google Calendar is not configured.");
  const accessToken = await getGoogleWorkspaceAccessToken();
  const deterministicId = deterministicGoogleEventId(input.localEventId);
  let eventId = input.googleEventId || deterministicId;
  let existing = eventId ? await readGoogleEvent(accessToken, eventId) : null;
  if (eventId && !existing && input.googleEventId) eventId = deterministicId;
  if (eventId && !existing && eventId !== input.googleEventId)
    existing = await readGoogleEvent(accessToken, eventId);
  const needsConference =
    input.createConference !== false && !meetUrl(existing ?? { id: "" });
  const body = {
    ...(!existing && eventId ? { id: eventId } : {}),
    summary: input.summary,
    description: input.description,
    start: { dateTime: input.startsAt, timeZone: input.timeZone },
    end: { dateTime: input.endsAt, timeZone: input.timeZone },
    attendees: input.attendees.map((attendee) => ({
      email: attendee.email,
      ...(attendee.displayName ? { displayName: attendee.displayName } : {}),
    })),
    ...(input.location ? { location: input.location } : {}),
    ...(needsConference
      ? {
          conferenceData: {
            createRequest: {
              requestId: `legalops-event-${crypto.randomUUID()}`,
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          },
        }
      : {}),
    guestsCanInviteOthers: false,
    guestsCanModify: false,
    guestsCanSeeOtherGuests: true,
  };
  const target = existing
    ? `${eventUrl(existing.id)}?conferenceDataVersion=1&sendUpdates=all`
    : `${eventUrl()}?conferenceDataVersion=1&sendUpdates=all`;
  const response = await fetch(target, {
    method: existing ? "PATCH" : "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const payload = (await response
    .json()
    .catch(() => ({}))) as GoogleCalendarEvent & {
    error?: { message?: string };
  };
  if (!response.ok || !payload.id)
    throw new Error(
      payload.error?.message ||
        `Google Calendar event sync failed (${response.status}).`,
    );
  const completed = needsConference
    ? await waitForMeet(accessToken, payload)
    : payload;
  const meetingUrl = meetUrl(completed) || meetUrl(existing ?? { id: "" });
  if (input.createConference !== false && !meetingUrl)
    throw new Error(
      "Google Calendar created the event but did not return a Meet link.",
    );
  return {
    eventId: completed.id,
    meetingUrl,
    htmlLink: completed.htmlLink ?? googleCalendarEventLink(completed.id),
  };
}

export async function addGoogleEventAttendee(
  eventId: string,
  attendee: CalendarAttendee,
) {
  if (!isGoogleCalendarConfigured())
    throw new Error("Google Calendar is not configured.");
  const accessToken = await getGoogleWorkspaceAccessToken();

  const currentResponse = await fetch(eventUrl(eventId), {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const current = (await currentResponse
    .json()
    .catch(() => ({}))) as GoogleCalendarEvent & {
    error?: { message?: string };
  };
  if (!currentResponse.ok) {
    throw new Error(
      current.error?.message ||
        `Could not read Google Calendar event (${currentResponse.status}).`,
    );
  }

  const normalizedEmail = attendee.email.trim().toLowerCase();
  const attendees = [...(current.attendees ?? [])];
  if (
    !attendees.some(
      (item) => item.email?.trim().toLowerCase() === normalizedEmail,
    )
  ) {
    attendees.push({
      email: normalizedEmail,
      ...(attendee.displayName ? { displayName: attendee.displayName } : {}),
    });
  }

  const response = await fetch(
    `${eventUrl(eventId)}?sendUpdates=all&conferenceDataVersion=1`,
    {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ attendees }),
      cache: "no-store",
    },
  );
  const payload = (await response
    .json()
    .catch(() => ({}))) as GoogleCalendarEvent & {
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(
      payload.error?.message ||
        `Could not add attendee to Google Calendar (${response.status}).`,
    );
  }

  return { meetingUrl: meetUrl(payload) };
}

export async function removeGoogleEventAttendee(
  eventId: string,
  email: string,
) {
  if (!isGoogleCalendarConfigured()) return;
  const accessToken = await getGoogleWorkspaceAccessToken();
  const current = await readGoogleEvent(accessToken, eventId);
  if (!current) return;
  const normalizedEmail = email.trim().toLowerCase();
  const attendees = (current.attendees ?? []).filter(
    (item) => item.email?.trim().toLowerCase() !== normalizedEmail,
  );
  const response = await fetch(
    `${eventUrl(eventId)}?sendUpdates=all&conferenceDataVersion=1`,
    {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ attendees }),
      cache: "no-store",
    },
  );
  if (!response.ok)
    throw new Error(
      `Could not remove attendee from Google Calendar (${response.status}).`,
    );
}
