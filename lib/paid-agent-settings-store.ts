import type { SupabaseClient } from '@supabase/supabase-js'
import type { PaidAgentSettings } from './paid-agent-settings'

export async function getUserPaidAgentSettings(
  supabase: SupabaseClient,
  userId: string
): Promise<PaidAgentSettings> {
  const { data } = await supabase
    .from('account_profiles')
    .select('paid_agent_settings')
    .eq('user_id', userId)
    .maybeSingle()

  return (data?.paid_agent_settings as PaidAgentSettings) ?? {}
}
