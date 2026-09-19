import { MAP_SECTION_IDS } from './contract-map'
import { contactReturnPath } from './contact-card'

// Only known public destinations may survive community signup.
export function clubReturnPath(path?: string | null): string | null {
  const map = /^\/community\/tools\/(?:mapa-contratos|playbook)(?:\?section=([a-z-]+))?$/.exec(path ?? '')
  if (map && (!map[1] || MAP_SECTION_IDS.includes(map[1]))) return path!
  if (path === '/club/checkout') return path
  if (/^\/community\/events\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path ?? '') && path !== '/community/events/manage') return path!
  return contactReturnPath(path)
}
