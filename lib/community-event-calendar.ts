import type { SupabaseClient } from "@supabase/supabase-js";
import {
  googleCalendarOrganizerEmail,
  isGoogleCalendarConfigured,
  upsertGoogleMeetEvent,
} from "@/lib/google-calendar";
import { communityEventUrl } from "@/lib/community-event-links";

export type CommunityEventCalendarInput = {
  id: string;
  slug: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string | null;
  participationMode: "remoto" | "presencial" | "hibrido";
  googleEventId?: string | null;
  locationLabel?: string | null;
  locationUrl?: string | null;
};

export async function syncCommunityEventCalendar(
  db: SupabaseClient,
  event: CommunityEventCalendarInput,
) {
  const organizer = googleCalendarOrganizerEmail();
  if (!isGoogleCalendarConfigured()) {
    return {
      ok: false as const,
      fields: {
        organizer_email: organizer,
        calendar_sync_status: "not_configured",
        calendar_sync_error: "Google Calendar credentials are not configured.",
      },
    };
  }

  const { data: registrations } = await db
    .from("community_event_rsvps")
    .select("guest_email,guest_name")
    .eq("event_id", event.id)
    .eq("response", "confirmed");
  const publicUrl = communityEventUrl(event.slug);

  try {
    const calendar = await upsertGoogleMeetEvent({
      summary: `${event.title} · legalops.club`,
      description: `${event.description}\n\nDetalhes e inscrições: ${publicUrl}`,
      startsAt: event.startsAt,
      endsAt:
        event.endsAt ||
        new Date(new Date(event.startsAt).getTime() + 60 * 60_000).toISOString(),
      timeZone: "America/Sao_Paulo",
      googleEventId: event.googleEventId,
      localEventId: event.id,
      createConference: event.participationMode !== "presencial",
      location:
        event.participationMode === "remoto"
          ? undefined
          : [event.locationLabel, event.locationUrl].filter(Boolean).join(" · "),
      attendees: (registrations ?? []).map((registration) => ({
        email: registration.guest_email,
        displayName: registration.guest_name,
      })),
    });
    return {
      ok: true as const,
      meetingUrl: calendar.meetingUrl,
      calendarUrl: calendar.htmlLink,
      fields: {
        organizer_email: organizer,
        google_event_id: calendar.eventId,
        google_meet_url: calendar.meetingUrl,
        calendar_sync_status: "synced",
        calendar_sync_error: null,
        calendar_synced_at: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      ok: false as const,
      fields: {
        organizer_email: organizer,
        calendar_sync_status: "error",
        calendar_sync_error:
          error instanceof Error
            ? error.message.slice(0, 500)
            : "Google Calendar sync failed.",
      },
    };
  }
}
