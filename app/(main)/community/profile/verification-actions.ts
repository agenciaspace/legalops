'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
export async function requestProfileVerification() {
  const db=await createServerSupabaseClient();const {data:{user}}=await db.auth.getUser()
  if(!user) redirect('/login')
  const {error}=await db.rpc('request_club_profile_review')
  if(error) redirect(`/community/profile?verification=${error.message.includes('PROFILE_INCOMPLETE')?'incomplete':'error'}#verification`)
  revalidatePath('/community/profile');revalidatePath('/community/members');revalidatePath('/club/admin/members')
  redirect('/community/profile?verification=requested#verification')
}
