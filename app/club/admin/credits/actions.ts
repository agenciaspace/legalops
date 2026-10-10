'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { isLegalOpsAdminEmail } from '@/lib/legalops-admin'
async function operator(){const db=await createServerSupabaseClient();const {data:{user}}=await db.auth.getUser();if(!user||!isLegalOpsAdminEmail(user.email))redirect('/community');return {user,admin:createAdminClient()}}
export async function configureCredits(form:FormData){
  const {admin}=await operator()
  const allowance=Number(form.get('allowance'));const period=String(form.get('period'))
  const packRaw=String(form.get('pack_credits')??'').trim();const pack=packRaw?Number(packRaw):null
  const rawPrice=String(form.get('pack_price')??'').trim()
  const price=rawPrice?Math.round(Number(rawPrice.replace(',','.'))*100):null
  const active=form.get('sales_active')==='on'
  const costs=Object.fromEntries(['agent_question','agent_summary','personalized_cv','cover_letter','interview_prep','linkedin_insights'].map(action=>[action,Number(form.get(action))]))
  if(!Number.isInteger(allowance)||allowance<0||allowance>1000000||!['day','month'].includes(period)||Object.values(costs).some(cost=>!Number.isInteger(cost)||cost<1||cost>1000000)||
    (pack!==null&&(!Number.isInteger(pack)||pack<1||pack>1000000))||(rawPrice&&!/^\d{1,6}([.,]\d{1,2})?$/.test(rawPrice))||(price!==null&&(price<100||price>10000000))||(active&&(!pack||!price)))redirect('/club/admin/credits?error=settings')
  const {error}=await admin.rpc('configure_club_credits',{included_allowance:allowance,allowance_period:period,pack_amount:pack,pack_price:price,sales_enabled:active,action_costs:costs})
  if(error)redirect('/club/admin/credits?error=settings')
  revalidatePath('/community/credits');revalidatePath('/club/admin/credits');redirect('/club/admin/credits?saved=1')
}
export async function reviewCreditOrder(form:FormData){
  const {user,admin}=await operator();const id=String(form.get('order_id'));const decision=form.get('decision')
  if(decision==='approve'){
    if(form.get('verified')!=='on')redirect('/club/admin/credits?error=verify')
    const {error}=await admin.rpc('approve_club_credit_order',{order_id:id,operator_id:user.id})
    if(error)redirect('/club/admin/credits?error=review')
  }else if(decision==='reject'){
    const note=String(form.get('note')??'').trim().slice(0,1000)
    if(note.length<10)redirect('/club/admin/credits?error=note')
    const {error}=await admin.from('club_credit_orders').update({status:'rejected',review_note:note,reviewed_by:user.id,reviewed_at:new Date().toISOString()}).eq('id',id).eq('status','submitted')
    if(error)redirect('/club/admin/credits?error=review')
  }else redirect('/club/admin/credits?error=review')
  revalidatePath('/community/credits');revalidatePath('/club/admin/credits');redirect('/club/admin/credits?saved=1')
}
