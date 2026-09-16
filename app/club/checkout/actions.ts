'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { hasActiveClubAccess } from '@/lib/community'
import { isProOfferOpen, PRO_RECEIPT_BUCKET, PRO_RECEIPT_MAX_BYTES, receiptFileType } from '@/lib/club-pro'

async function buyer() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email_confirmed_at) redirect('/login?next=/club/checkout')
  const { data: member } = await supabase.from('community_members').select('club_access_status,club_access_expires_at').eq('user_id',user.id).maybeSingle()
  if (!hasActiveClubAccess(member)) redirect('/club/entrar?next=/club/checkout')
  return { user, supabase, admin: createAdminClient() }
}
export async function createProOrder() {
  const { user, admin } = await buyer()
  const { data: offer } = await admin.from('club_pro_offer').select('price_cents,period_months,active').eq('id',true).single()
  if (!isProOfferOpen(offer)) redirect('/club/checkout?error=unavailable')
  const { error } = await admin.from('club_pro_orders').insert({ user_id:user.id, price_cents:offer.price_cents, period_months:offer.period_months })
  if (error && error.code !== '23505') redirect('/club/checkout?error=order')
  revalidatePath('/club/checkout')
  redirect('/club/checkout')
}
export async function submitProReceipt(form: FormData): Promise<{ ok: boolean; error?: string }> {
  const { user, admin } = await buyer()
  const id = String(form.get('order_id') ?? '')
  const file = form.get('receipt')
  if (!(file instanceof File) || file.size === 0 || file.size > PRO_RECEIPT_MAX_BYTES) return { ok:false,error:'Envie um PDF, PNG ou JPG de até 5 MB.' }
  const { data: order } = await admin.from('club_pro_orders').select('id,status,receipt_path').eq('id',id).eq('user_id',user.id).maybeSingle()
  if (!order || order.status !== 'pending') return { ok:false,error:'Este pedido já foi enviado ou encerrado. Atualize a página.' }
  const bytes = new Uint8Array(await file.arrayBuffer())
  const type = receiptFileType(bytes)
  if (!type) return { ok:false,error:'O arquivo precisa ser um PDF, PNG ou JPG válido.' }
  const path = `${user.id}/${order.id}/${crypto.randomUUID()}.${type.extension}`
  const { error: uploadError } = await admin.storage.from(PRO_RECEIPT_BUCKET).upload(path,bytes,{ contentType:type.contentType,upsert:false })
  if (uploadError) return { ok:false,error:'Não conseguimos guardar o comprovante. Tente novamente.' }
  const { data: saved, error } = await admin.from('club_pro_orders').update({ receipt_path:path,status:'submitted' }).eq('id',order.id).eq('user_id',user.id).eq('status','pending').select('id')
  if (error || !saved?.length) {
    await admin.storage.from(PRO_RECEIPT_BUCKET).remove([path])
    return { ok:false,error:'Não conseguimos registrar o comprovante. Atualize a página e tente novamente.' }
  }
  revalidatePath('/club/checkout'); revalidatePath('/club/admin/pro')
  return { ok:true }
}
