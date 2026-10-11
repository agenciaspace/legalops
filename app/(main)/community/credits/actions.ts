'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { agentSession } from '@/lib/club-agent-access'
import { createAdminClient } from '@/lib/supabase-admin'
import { PRO_RECEIPT_BUCKET, PRO_RECEIPT_MAX_BYTES, receiptFileType } from '@/lib/club-pro'
async function buyer(){const access=await agentSession();if(access.error)redirect('/community/pro');return {...access,admin:createAdminClient()}}
export async function createCreditOrder(){
  const {user,admin}=await buyer()
  const {error}=await admin.rpc('create_club_credit_order',{member_id:user.id})
  if(error)redirect('/community/credits?error=order')
  revalidatePath('/community/credits');redirect('/community/credits')
}
export async function submitCreditReceipt(form:FormData):Promise<{ok:boolean;error?:string}>{
  const {user,admin}=await buyer()
  const id=String(form.get('order_id')??'');const file=form.get('receipt')
  if(!(file instanceof File)||file.size===0||file.size>PRO_RECEIPT_MAX_BYTES)return {ok:false,error:'Envie um PDF, PNG ou JPG de até 5 MB.'}
  const {data:order}=await admin.from('club_credit_orders').select('id,status').eq('id',id).eq('user_id',user.id).maybeSingle()
  if(!order||order.status!=='pending')return {ok:false,error:'Pedido encerrado ou já enviado. Atualize a página.'}
  const bytes=new Uint8Array(await file.arrayBuffer());const type=receiptFileType(bytes)
  if(!type)return {ok:false,error:'Arquivo inválido.'}
  const path=`${user.id}/credits/${order.id}/${crypto.randomUUID()}.${type.extension}`
  const {error:uploadError}=await admin.storage.from(PRO_RECEIPT_BUCKET).upload(path,bytes,{contentType:type.contentType,upsert:false})
  if(uploadError)return {ok:false,error:'Não conseguimos guardar o comprovante.'}
  const {data:saved,error}=await admin.from('club_credit_orders').update({receipt_path:path,status:'submitted'}).eq('id',id).eq('user_id',user.id).eq('status','pending').select('id')
  if(error||!saved?.length){await admin.storage.from(PRO_RECEIPT_BUCKET).remove([path]);return {ok:false,error:'Atualize a página e tente novamente.'}}
  revalidatePath('/community/credits');revalidatePath('/club/admin/credits');return {ok:true}
}
export async function cancelCreditOrder(form:FormData){
  const {user,admin}=await buyer()
  await admin.from('club_credit_orders').update({status:'canceled'}).eq('id',String(form.get('order_id'))).eq('user_id',user.id).eq('status','pending')
  revalidatePath('/community/credits');redirect('/community/credits')
}
