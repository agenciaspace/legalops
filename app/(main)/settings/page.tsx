import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { SettingsClient } from '@/components/SettingsClient'

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('account_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Configurações</h1>
      <p className="mt-1 text-sm text-slate-500">
        Gerencie seu perfil profissional e preferências.
      </p>
      <SettingsClient profile={profile} userEmail={user.email ?? ''} />
    </div>
  )
}
