"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { hasActiveClubAccess } from "@/lib/community";
import { isLegalOpsAdminEmail } from "@/lib/legalops-admin";
import {
  googleCalendarOrganizerEmail,
  isGoogleCalendarConfigured,
  upsertGoogleMeetEvent,
} from "@/lib/google-calendar";

function value(form: FormData, key: string, max: number) {
  return String(form.get(key) ?? "")
    .trim()
    .slice(0, max);
}

function brtTimestamp(raw: string) {
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) return undefined;
  const date = new Date(`${raw}:00-03:00`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

async function authorizedEvent(eventId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/community/events/manage?event=${eventId}`);
  const { data: member } = await supabase
    .from("community_members")
    .select("club_access_status,club_access_expires_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!hasActiveClubAccess(member)) redirect("/club/entrar");
  const admin = createAdminClient();
  const { data: eventAdmin } = await admin
    .from("community_event_admins")
    .select("role")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!eventAdmin && !isLegalOpsAdminEmail(user.email))
    redirect("/community/calendar");
  return { admin, user };
}

export async function updateEventConfiguration(formData: FormData) {
  const eventId = value(formData, "event_id", 80);
  const title = value(formData, "title", 180);
  const description = value(formData, "description", 5000);
  const hostName = value(formData, "host_name", 200);
  const location = value(formData, "location_label", 300);
  const locationUrl = value(formData, "location_url", 1000);
  const mode = ["presencial", "remoto", "hibrido"].includes(
    value(formData, "participation_mode", 20),
  )
    ? value(formData, "participation_mode", 20)
    : "remoto";
  const details = value(formData, "participation_details", 3000);
  if (
    title.length < 3 ||
    description.length < 10 ||
    hostName.length < 2 ||
    location.length < 2 ||
    (locationUrl && !/^https:\/\//i.test(locationUrl))
  )
    redirect(`/community/events/manage?event=${eventId}&error=fields`);
  const questions = value(formData, "pre_questions", 5000)
    .split("\n")
    .map((q) => q.trim())
    .filter(Boolean)
    .slice(0, 20);
  const startsAt = brtTimestamp(value(formData, "starts_at", 20));
  const endsAt = brtTimestamp(value(formData, "ends_at", 20));
  if (startsAt === undefined || endsAt === undefined)
    redirect(`/community/events/manage?event=${eventId}&error=fields`);
  const publish = formData.get("is_published") === "on";
  const dateTbd = formData.get("date_tbd") === "on";
  if (publish && !dateTbd && !startsAt)
    redirect(`/community/events/manage?event=${eventId}&error=date`);
  const locationLabel = dateTbd
    ? `${location.replace(/\s*[—-]\s*data a confirmar\s*$/i, "").trim()} — data a confirmar`
    : location.replace(/\s*[—-]\s*data a confirmar\s*$/i, "").trim();
  let fields: { key: string; label: string; required: boolean }[] = [];
  try {
    const parsed = JSON.parse(
      value(formData, "extra_registration_fields", 5000) || "[]",
    ) as unknown;
    fields = (Array.isArray(parsed) ? parsed : [])
      .filter((f): f is { key: string; label: string; required?: boolean } =>
        Boolean(f && typeof f === "object" && "key" in f && "label" in f),
      )
      .slice(0, 12)
      .map((f) => ({
        key: String(f.key).slice(0, 40),
        label: String(f.label).slice(0, 160),
        required: f.required !== false,
      }));
  } catch {
    redirect(`/community/events/manage?event=${eventId}&error=fields`);
  }
  const { admin } = await authorizedEvent(eventId);
  const { data: currentEvent } = await admin
    .from("community_events")
    .select("google_event_id")
    .eq("id", eventId)
    .maybeSingle();
  const shouldCreateMeet =
    !dateTbd && Boolean(startsAt) && mode !== "presencial";
  let calendarFields: Record<string, unknown> = {
    organizer_email: googleCalendarOrganizerEmail(),
  };
  let resolvedLocation = locationUrl || null;
  let resolvedLabel = locationLabel;
  let calendarState = "";
  if (shouldCreateMeet && startsAt) {
    if (!isGoogleCalendarConfigured()) {
      calendarFields = {
        ...calendarFields,
        calendar_sync_status: "not_configured",
        calendar_sync_error: "Google Calendar credentials are not configured.",
      };
      calendarState = "not-configured";
    } else {
      const { data: registrations } = await admin
        .from("community_event_rsvps")
        .select("guest_email,guest_name")
        .eq("event_id", eventId)
        .eq("response", "confirmed");
      try {
        const calendar = await upsertGoogleMeetEvent({
          summary: `${title} · legalops.club`,
          description,
          startsAt,
          endsAt:
            endsAt ||
            new Date(new Date(startsAt).getTime() + 60 * 60_000).toISOString(),
          timeZone: "America/Sao_Paulo",
          googleEventId: currentEvent?.google_event_id,
          localEventId: eventId,
          createConference: true,
          attendees: (registrations ?? []).map((registration) => ({
            email: registration.guest_email,
            displayName: registration.guest_name,
          })),
        });
        resolvedLocation = calendar.meetingUrl;
        resolvedLabel = mode === "remoto" ? "Google Meet" : locationLabel;
        calendarFields = {
          ...calendarFields,
          google_event_id: calendar.eventId,
          google_meet_url: calendar.meetingUrl,
          calendar_sync_status: "synced",
          calendar_sync_error: null,
          calendar_synced_at: new Date().toISOString(),
        };
      } catch (error) {
        calendarFields = {
          ...calendarFields,
          calendar_sync_status: "error",
          calendar_sync_error:
            error instanceof Error
              ? error.message.slice(0, 500)
              : "Google Calendar sync failed.",
        };
        calendarState = "error";
      }
    }
  }
  await admin
    .from("community_events")
    .update({
      title,
      description,
      host_name: hostName,
      location_label: resolvedLabel,
      location_url: resolvedLocation,
      participation_mode: mode,
      participation_details: details,
      pre_questions: questions,
      extra_registration_fields: fields,
      is_published: publish,
      ...calendarFields,
      ...(startsAt ? { starts_at: startsAt } : {}),
      ...(endsAt ? { ends_at: endsAt } : {}),
    })
    .eq("id", eventId);
  revalidatePath("/community/calendar");
  revalidatePath(`/community/events/${value(formData, "slug", 180)}`);
  redirect(
    `/community/events/manage?event=${eventId}&saved=1${calendarState ? `&calendar=${calendarState}` : ""}`,
  );
}

export async function addEventOrganizer(formData: FormData) {
  const eventId = value(formData, "event_id", 80);
  const organizerId = value(formData, "organizer_id", 80);
  const { admin } = await authorizedEvent(eventId);
  const { data: member } = await admin
    .from("community_members")
    .select("user_id")
    .eq("user_id", organizerId)
    .maybeSingle();
  if (!member)
    redirect(`/community/events/manage?event=${eventId}&error=member`);
  await admin
    .from("community_event_admins")
    .upsert({ event_id: eventId, user_id: organizerId, role: "organizer" });
  redirect(`/community/events/manage?event=${eventId}&saved=1`);
}
