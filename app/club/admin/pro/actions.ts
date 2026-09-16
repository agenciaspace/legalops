'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { isLegalOpsAdminEmail } from '@/lib/legalops-admin'
import { generateClubJobAlerts } from '@/lib/club-job-matching'
export async function reviewProOrder(form: FormData) {
  const supabase=await createServerSupabaseClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user || !isLegalOpsAdminEmail(user.email)) redirect('/community')
  const orderId=String(form.get('order_id')??'')
  const decision=String(form.get('decision')??'')
  const admin=createAdminClient()
  if(decision==='approve') {
    if(form.get('verified')!=='on') redirect('/club/admin/pro?error=verify')
    const {error}=await admin.rpc('approve_club_pro_order',{order_id:orderId,operator_id:user.id})
    if(error) redirect('/club/admin/pro?error=review')
    const {data:order}=await admin.from('club_pro_orders').select('user_id').eq('id',orderId).single()
    if(order) try { await generateClubJobAlerts(order.user_id) } catch(error) { console.error('[pro/activation] job matching failed:',error) }
  } else if(decision==='reject') {
    const note=String(form.get('note')??'').trim().slice(0,1000)
    if(note.length<10) redirect('/club/admin/pro?error=note')
    const {error}=await admin.from('club_pro_orders').update({status:'rejected',review_note:note,reviewed_by:user.id,reviewed_at:new Date().toISOString()}).eq('id',orderId).eq('status','submitted')
    if(error) redirect('/club/admin/pro?error=review')
  } else redirect('/club/admin/pro?error=review')
  revalidatePath('/club/admin/pro');revalidatePath('/club/checkout');revalidatePath('/community')
  redirect('/club/admin/pro?saved=1')
}

export async function configureProOffer(form: FormData) {
  const supabase=await createServerSupabaseClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user||!isLegalOpsAdminEmail(user.email))redirect('/community')
  const raw=String(form.get('price')??'').trim()
  const months=Number(form.get('period_months'))
  if(!/^\d{1,6}([.,]\d{1,2})?$/.test(raw)||![1,12].includes(months))redirect('/club/admin/pro?error=offer')
  const cents=Math.round(Number(raw.replace(',','.'))*100)
  if(cents<100||cents>10000000)redirect('/club/admin/pro?error=offer')
  const {error}=await createAdminClient().from('club_pro_offer').update({price_cents:cents,period_months:months,active:form.get('active')==='on'}).eq('id',true)
  if(error)redirect('/club/admin/pro?error=offer')
  revalidatePath('/club/admin/pro');revalidatePath('/club/checkout');revalidatePath('/club')
  redirect('/club/admin/pro?saved=1')
}
