'use server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { sendClubWelcomeEmailIfNeeded } from '@/lib/welcome-email'
import { validateClubProfile } from '@/lib/club-membership'
import { isOwnedAvatarPath } from '@/lib/club-avatar'
export async function joinClub(body: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  const checked = validateClubProfile(body)
  if (checked.error) return { ok: false, error: checked.error }
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email_confirmed_at) return { ok: false, error: 'Entre na sua conta e confirme o email antes de continuar.' }
  const { data: profile } = await supabase.from('account_profiles').select('avatar_path').eq('user_id', user.id).maybeSingle()
  if (!isOwnedAvatarPath(profile?.avatar_path, user.id)) return { ok: false, error: 'Adicione sua foto para concluir o cadastro.' }
  const { error } = await supabase.rpc('join_club', { profile_data: {
    ...checked.profile, sector: body.sector, accepted_rules: true, city: checked.profile.preferred_locations[0], interests: checked.profile.areas_of_expertise,
  } })
  if (error) return { ok: false, error: error.message.includes('PHOTO_REQUIRED') ? 'Adicione sua foto para concluir o cadastro.' : 'Não foi possível concluir sua entrada. Confira os dados; se o problema continuar, fale com a administração.' }
  try {
    await sendClubWelcomeEmailIfNeeded(user)
  } catch (error) {
    // The community retries pending welcome messages; email must not undo admission.
    console.error('[club/join] welcome email failed:', error)
  }
  return { ok: true }
}
