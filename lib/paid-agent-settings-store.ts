import type { SupabaseClient } from '@supabase/supabase-js'
import { DEFAULT_PAID_AGENT_SETTINGS, type PaidAgentSettings } from './paid-agent-settings'

export async function getUserPaidAgentSettings(
  supabase: SupabaseClient,
  userId: string,
): Promise<PaidAgentSettings> {
  const { data } = await supabase
    .from('user_paid_agent_settings')
    .select('interview_prep_enabled, cover_letter_enabled')
    .eq('user_id', userId)
    .maybeSingle()

  if (!data) return DEFAULT_PAID_AGENT_SETTINGS

  return {
    interviewPrepEnabled: data.interview_prep_enabled ?? false,
    coverLetterEnabled: data.cover_letter_enabled ?? false,
  }
}
