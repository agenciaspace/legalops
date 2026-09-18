import { contactReturnPath } from './contact-card'

// Only known public destinations may survive community signup.
export function clubReturnPath(path?: string | null): string | null {
  if (/^\/community\/tools\/mapa-contratos(?:\?section=(solicitacao|triagem|elaboracao|negociacao|aprovacao|assinatura|execucao|renovacao))?$/.test(path ?? '')) return path!
  if (path === '/club/checkout') return path
  if (/^\/community\/events\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path ?? '') && path !== '/community/events/manage') return path!
  return contactReturnPath(path)
}
