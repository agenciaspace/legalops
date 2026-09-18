import { contactReturnPath } from './contact-card'

// Only known public destinations may survive community signup.
export function clubReturnPath(path?: string | null): string | null {
  if (path === '/club/checkout') return path
  if (/^\/community\/events\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path ?? '') && path !== '/community/events/manage') return path!
  return contactReturnPath(path)
}
