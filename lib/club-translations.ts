import type { SupabaseClient } from '@supabase/supabase-js'
import type { ClubLocale } from './club-locale'
import type { TranslationPayload } from './club-translation-model'
export type TranslationSource = { id: string; entity_type: string; entity_id: string; payload: TranslationPayload; revision: number; status: 'pending' | 'processing' | 'ready' | 'failed'; detected_locale: string | null; locale_hint: string | null; translations: Partial<Record<ClubLocale, TranslationPayload>> }
export async function loadClubTranslations(supabase: SupabaseClient, ids: string[]) {
  const { data: config } = await supabase.from('club_translation_config').select('reading_enabled').eq('id', true).maybeSingle()
  const enabled = config?.reading_enabled === true
  if (!enabled || !ids.length) return { enabled, sources: new Map<string, TranslationSource>() }
  const { data } = await supabase.from('club_translation_sources').select('id,entity_type,entity_id,payload,revision,status,detected_locale,locale_hint,translations').in('entity_id', Array.from(new Set(ids)))
  return { enabled, sources: new Map((data ?? []).map((source: TranslationSource) => [`${source.entity_type}:${source.entity_id}`, source])) }
}
