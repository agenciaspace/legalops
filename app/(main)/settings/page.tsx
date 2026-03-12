import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user!.id)
    .single()

  const { data: logs } = await supabase
    .from('notification_log')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <SettingsClient
      initialPrefs={prefs}
      initialLogs={logs ?? []}
      userEmail={user!.email ?? ''}
      vapidPublicKey={process.env.VAPID_PUBLIC_KEY ?? ''}
    />
  )
}
