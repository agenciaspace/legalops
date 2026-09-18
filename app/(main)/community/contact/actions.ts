'use server'
import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { hasActiveClubAccess } from '@/lib/community'
import { CONTACT_ID, validateContactDetails } from '@/lib/contact-card'

async function activeMember() {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return null
  const { data: member } = await db.from('community_members').select('club_access_status,club_access_expires_at').eq('user_id', user.id).maybeSingle()
  return hasActiveClubAccess(member) ? { db, user } : null
}

export async function saveContactDetails(form: FormData) {
  const auth = await activeMember()
  if (!auth) return { error: 'Entre na comunidade para editar seu contato.' }
  const checked = validateContactDetails({ email: form.get('email'), phone: form.get('phone'), website: form.get('website'), public_enabled: form.get('public_enabled') === 'on' })
  if (checked.error) return { error: checked.error }
  const { error } = await auth.db.from('community_contact_cards').upsert({ user_id: auth.user.id, ...checked.details })
  if (error) return { error: 'Não foi possível salvar. Tente novamente.' }
  revalidatePath('/community/contact')
  revalidatePath(`/contact/${auth.user.id}`)
  return { ok: true }
}

export async function saveCommunityContact(id: string, saved: boolean) {
  if (!CONTACT_ID.test(id)) return { error: 'Contato inválido.' }
  const auth = await activeMember()
  if (!auth) return { error: 'Entre na comunidade para salvar contatos.' }
  if (id === auth.user.id) return { error: 'Este é seu próprio contato.' }
  const { data: target } = await auth.db.from('community_members').select('club_access_status,club_access_expires_at').eq('user_id', id).maybeSingle()
  if (!hasActiveClubAccess(target)) return { error: 'Este contato não está disponível.' }
  const { error } = saved
    ? await auth.db.from('community_saved_contacts').upsert({ user_id: auth.user.id, member_id: id }, { onConflict: 'user_id,member_id', ignoreDuplicates: true })
    : await auth.db.from('community_saved_contacts').delete().eq('user_id', auth.user.id).eq('member_id', id)
  if (error) return { error: 'Não foi possível atualizar seus contatos.' }
  revalidatePath('/community/members')
  revalidatePath(`/contact/${id}`)
  return { ok: true }
}
