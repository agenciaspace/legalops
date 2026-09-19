'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { isLegalOpsAdminEmail } from '@/lib/legalops-admin'
export async function reviewMemberProfile(form:FormData) {
  const db=await createServerSupabaseClient();const {data:{user}}=await db.auth.getUser()
  if(!user||!isLegalOpsAdminEmail(user.email)) redirect('/community')
  const id=String(form.get('request_id')??''), decision=String(form.get('decision')??''), note=String(form.get('note')??'').trim()
  if(!/^[0-9a-f-]{36}$/i.test(id)||!['verified','rejected'].includes(decision)||note.length<10||note.length>1000||(decision==='verified'&&form.get('checked')!=='on')) redirect('/club/admin/members?error=fields')
  const admin=createAdminClient()
  const {error}=await admin.rpc('review_club_profile',{p_request:id,p_operator:user.id,p_decision:decision,p_note:note})
  if(error) redirect('/club/admin/members?error=conflict')
  revalidatePath('/club/admin/members');revalidatePath('/community/profile');revalidatePath('/community/members');revalidatePath('/community/members/[id]','page')
  redirect('/club/admin/members?saved=1')
}
