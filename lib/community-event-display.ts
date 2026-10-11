export function isEventDatePending(event: { location_label: string | null }) {
  return /data a confirmar/i.test(event.location_label ?? '')
}

export function upcomingCommunityEvents<T extends { starts_at: string; ends_at?: string | null; location_label: string | null }>(events: T[], now = Date.now()) {
  return events.filter(event => isEventDatePending(event) || new Date(event.ends_at || event.starts_at).getTime() >= now)
    .sort((a, b) => Number(isEventDatePending(a)) - Number(isEventDatePending(b)) || new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
}
