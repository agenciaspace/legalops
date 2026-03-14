import { pt } from './pt'
import { en } from './en'
import type { Locale } from '../locale'

export type Dictionary = typeof pt
export const dictionaries: Record<Locale, Dictionary> = { pt, en }
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale]
}
