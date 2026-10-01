export const LEGALOPS_CLUB_ORIGIN = "https://legalops.club";

export function communityEventPath(slug: string) {
  return `/community/events/${encodeURIComponent(slug)}`;
}

export function communityEventUrl(slug: string) {
  return `${LEGALOPS_CLUB_ORIGIN}${communityEventPath(slug)}`;
}

export function communityEventSlug(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}
