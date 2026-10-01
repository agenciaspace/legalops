"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { syncCommunityEventCalendar } from "@/lib/community-event-calendar";
import { communityEventSlug } from "@/lib/community-event-links";
import { requireLegalOpsAdmin } from "@/lib/legalops-admin";

function value(form: FormData, key: string, max: number) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

function brtTimestamp(raw: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) return null;
  const date = new Date(`${raw}:00-03:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function createCommunityEvent(formData: FormData) {
  const { admin, user } = await requireLegalOpsAdmin("/community/events/new");
  const title = value(formData, "title", 180);
  const description = value(formData, "description", 5000);
  const hostName = value(formData, "host_name", 200);
  const startsAt = brtTimestamp(value(formData, "starts_at", 20));
  const endsAt = brtTimestamp(value(formData, "ends_at", 20));
  const modeValue = value(formData, "participation_mode", 20);
  const participationMode = ["remoto", "presencial", "hibrido"].includes(modeValue)
    ? (modeValue as "remoto" | "presencial" | "hibrido")
    : "remoto";
  const locationLabel = value(formData, "location_label", 300);
  const locationUrl = value(formData, "location_url", 1000);
  const participationDetails = value(formData, "participation_details", 3000);
  const publish = formData.get("is_published") === "on";
  if (
    title.length < 3 ||
    description.length < 10 ||
    hostName.length < 2 ||
    !startsAt ||
    !endsAt ||
    new Date(endsAt) <= new Date(startsAt) ||
    locationLabel.length < 2 ||
    (locationUrl && !/^https:\/\//i.test(locationUrl))
  ) {
    redirect("/community/events/new?error=fields");
  }

  const baseSlug = communityEventSlug(title) || "evento";
  let slug = baseSlug;
  for (let suffix = 2; suffix < 100; suffix += 1) {
    const { data: collision } = await admin
      .from("community_events")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!collision) break;
    slug = `${baseSlug}-${suffix}`;
  }

  const { data: event, error } = await admin
    .from("community_events")
    .insert({
      slug,
      title,
      description,
      host_name: hostName,
      starts_at: startsAt,
      ends_at: endsAt,
      location_label: locationLabel,
      location_url: locationUrl || null,
      event_type: "encontro",
      is_published: publish,
      participation_mode: participationMode,
      participation_details: participationDetails,
      organizer_email: "hi@legalops.club",
      calendar_sync_status: "pending",
    })
    .select("id,google_event_id")
    .single();
  if (error || !event) redirect("/community/events/new?error=create");

  await admin.from("community_event_admins").upsert({
    event_id: event.id,
    user_id: user.id,
    role: "owner",
  });

  const calendar = await syncCommunityEventCalendar(admin, {
    id: event.id,
    slug,
    title,
    description,
    startsAt,
    endsAt,
    participationMode,
    googleEventId: event.google_event_id,
    locationLabel,
    locationUrl: locationUrl || null,
  });
  await admin
    .from("community_events")
    .update({
      ...calendar.fields,
      ...(calendar.ok && calendar.meetingUrl && participationMode === "remoto"
        ? { location_label: "Google Meet", location_url: calendar.meetingUrl }
        : {}),
    })
    .eq("id", event.id);

  revalidatePath("/community/calendar");
  revalidatePath(`/community/events/${slug}`);
  redirect(
    `/community/events/manage?event=${event.id}&created=1${calendar.ok ? "" : `&calendar=${calendar.fields.calendar_sync_status === "not_configured" ? "not-configured" : "error"}`}`,
  );
}
