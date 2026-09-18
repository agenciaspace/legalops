import { clubReturnPath } from './club-return-path'
export function googleReturnPath(requested: string | null): string {
  // Google signup always passes through community profile completion.
  let destination = clubReturnPath(requested)
  if (requested?.startsWith('/club/entrar?')) {
    destination = clubReturnPath(new URLSearchParams(requested.split('?').slice(1).join('?')).get('next'))
  }
  return destination ? `/club/entrar?next=${encodeURIComponent(destination)}` : '/club/entrar'
}
