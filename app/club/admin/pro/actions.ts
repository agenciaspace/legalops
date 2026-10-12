'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { isLegalOpsAdminEmail } from '@/lib/legalops-admin'
import { generateClubJobAlerts } from '@/lib/club-job-matching'
import { deliverProNotices } from '@/lib/club-pro-notices'
import { proPaymentUrl } from '@/lib/club-pro'

async function notifyPro() {
  try { await deliverProNotices() } catch { console.error('[pro/activation] notice queue unavailable') }
}
function providerDate(form:FormData) {
  const value=String(form.get('cycle_expires_at')??'')
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))redirect('/club/admin/pro?error=date')
  const date=new Date(`${value}-03:00`)
  if(!Number.isFinite(date.getTime()))redirect('/club/admin/pro?error=date')
  return date.toISOString()
}
export async function reviewProOrder(form: FormData) {
  const supabase=await createServerSupabaseClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user || !isLegalOpsAdminEmail(user.email)) redirect('/community')
  const orderId=String(form.get('order_id')??'')
  const decision=String(form.get('decision')??'')
  const admin=createAdminClient()
  if(decision==='approve') {
    if(form.get('verified')!=='on') redirect('/club/admin/pro?error=verify')
    const {data:purchase,error:purchaseError}=await admin.from('club_pro_orders').select('payment_mode').eq('id',orderId).single()
    if(purchaseError||!purchase)redirect('/club/admin/pro?error=review')
    const {error}=purchase.payment_mode==='mercadopago_subscription'
      ? await admin.rpc('approve_club_pro_subscription_order',{order_id:orderId,operator_id:user.id,subscription_id:String(form.get('subscription_id')??'').trim(),cycle_expires_at:providerDate(form),is_trial:form.get('grant_kind')==='trial',payment_id:form.get('grant_kind')==='trial'?null:String(form.get('payment_id')??'').trim()})
      : await admin.rpc('approve_club_pro_order',{order_id:orderId,operator_id:user.id})
    if(error) redirect('/club/admin/pro?error=review')
    const {data:order}=await admin.from('club_pro_orders').select('user_id').eq('id',orderId).single()
    if(order) try { await generateClubJobAlerts(order.user_id) } catch(error) { console.error('[pro/activation] job matching failed:',error) }
    await notifyPro()
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
  const mode=String(form.get('payment_mode')??'pix')
  const paymentUrl=String(form.get('payment_url')??'').trim()||null
  if(!['pix','mercadopago_subscription'].includes(mode)||(mode==='mercadopago_subscription'&&(months!==1||!proPaymentUrl({payment_mode:mode,payment_url:paymentUrl}))))redirect('/club/admin/pro?error=offer')
  const {error}=await createAdminClient().from('club_pro_offer').update({price_cents:cents,period_months:months,active:form.get('active')==='on',payment_mode:mode,payment_url:mode==='pix'?null:paymentUrl,trial_days:mode==='pix'?0:7}).eq('id',true)
  if(error)redirect('/club/admin/pro?error=offer')
  revalidatePath('/club/admin/pro');revalidatePath('/club/checkout');revalidatePath('/club')
  redirect('/club/admin/pro?saved=1')
}

async function operator() {
  const supabase=await createServerSupabaseClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user||!isLegalOpsAdminEmail(user.email))redirect('/community')
  return {user,admin:createAdminClient()}
}
export async function recordSubscriptionPayment(form:FormData) {
  const {user,admin}=await operator()
  if(form.get('verified')!=='on')redirect('/club/admin/pro?error=verify')
  const {error}=await admin.rpc('record_club_pro_subscription_payment',{member_id:String(form.get('user_id')??''),operator_id:user.id,payment_id:String(form.get('payment_id')??'').trim(),cycle_expires_at:providerDate(form)})
  if(error)redirect('/club/admin/pro?error=review')
  await notifyPro()
  revalidatePath('/club/checkout');revalidatePath('/club/admin/pro');revalidatePath('/community/pro')
  redirect('/club/admin/pro?saved=1')
}
export async function recordSubscriptionCancellation(form:FormData) {
  const {admin}=await operator()
  if(form.get('verified')!=='on')redirect('/club/admin/pro?error=verify')
  const {data,error}=await admin.from('club_pro_subscriptions').update({state:'canceled',updated_at:new Date().toISOString()}).eq('user_id',String(form.get('user_id')??'')).select('user_id')
  if(error||!data?.length)redirect('/club/admin/pro?error=review')
  revalidatePath('/club/checkout');revalidatePath('/club/admin/pro')
  redirect('/club/admin/pro?saved=1')
}
export async function recordProRefund(form:FormData) {
  const {user,admin}=await operator()
  if(form.get('verified')!=='on')redirect('/club/admin/pro?error=verify')
  const {error}=await admin.rpc('record_club_pro_refund',{order_id:String(form.get('order_id')??''),operator_id:user.id,reason:String(form.get('note')??'').trim()})
  if(error)redirect('/club/admin/pro?error=review')
  revalidatePath('/club/checkout');revalidatePath('/club/admin/pro');revalidatePath('/community/pro')
  redirect('/club/admin/pro?saved=1')
}
export async function retryProNotice(form:FormData) {
  const {admin}=await operator()
  if(form.get('verified')!=='on')redirect('/club/admin/pro?error=verify')
  const {data,error}=await admin.from('club_pro_notices').update({status:'pending',claimed_at:null}).eq('id',String(form.get('notice_id')??'')).eq('status','failed').select('id')
  if(error||!data?.length)redirect('/club/admin/pro?error=review')
  await notifyPro()
  revalidatePath('/club/admin/pro');redirect('/club/admin/pro?saved=1')
}
export async function updatePilotCounts(form:FormData) {
  const {admin}=await operator()
  const invited=Number(form.get('invited'));const demonstrations=Number(form.get('demonstrations'))
  if(!Number.isSafeInteger(invited)||!Number.isSafeInteger(demonstrations)||invited<0||invited>100000||demonstrations<0||demonstrations>invited)redirect('/club/admin/pro?error=metrics')
  const {error}=await admin.from('club_pro_pilot').update({invited,demonstrations,updated_at:new Date().toISOString()}).eq('id',true)
  if(error)redirect('/club/admin/pro?error=metrics')
  revalidatePath('/club/admin/pro');redirect('/club/admin/pro?saved=1')
}
