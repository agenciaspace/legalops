import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user!.id)
    .maybeSingle()

  return <SettingsClient initialProfile={profile} />
}
