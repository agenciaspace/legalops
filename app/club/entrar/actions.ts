'use server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { validateClubProfile } from '@/lib/club-membership'
export async function joinClub(body: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  const checked = validateClubProfile(body)
  if (checked.error) return { ok: false, error: checked.error }
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email_confirmed_at) return { ok: false, error: 'Entre na sua conta e confirme o email antes de continuar.' }
  const { error } = await supabase.rpc('join_club', { profile_data: {
    ...checked.profile, sector: body.sector, accepted_rules: true, city: checked.profile.preferred_locations[0], interests: checked.profile.areas_of_expertise,
  } })
  if (error) return { ok: false, error: 'Não foi possível concluir sua entrada. Confira os dados; se o problema continuar, fale com a administração.' }
  return { ok: true }
}
