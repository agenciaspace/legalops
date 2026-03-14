import type { PaidAgentSettings } from '@/lib/paid-agent-settings'
import { defaultPaidAgentSettings } from '@/lib/paid-agent-settings'

type SupabaseLikeClient = {
  from: (table: string) => {
    select: (columns?: string) => any
  }
}

export async function getUserPaidAgentSettings(
  supabase: SupabaseLikeClient,
  userId: string
): Promise<PaidAgentSettings> {
  const { data } = await supabase
    .from('account_profiles')
    .select('paid_agent_settings')
    .eq('user_id', userId)
    .maybeSingle()

  const raw = (data?.paid_agent_settings ?? {}) as Partial<PaidAgentSettings>

  return {
    interview_prep_enabled: raw.interview_prep_enabled ?? defaultPaidAgentSettings.interview_prep_enabled,
    cover_letter_enabled: raw.cover_letter_enabled ?? defaultPaidAgentSettings.cover_letter_enabled,
    outreach_enabled: raw.outreach_enabled ?? defaultPaidAgentSettings.outreach_enabled,
  }
}
