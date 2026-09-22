import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { hasActiveClubAccess } from '@/lib/community'
import { isOwnedAvatarPath } from '@/lib/club-avatar'
export const dynamic='force-dynamic'
export async function GET(_request:NextRequest,{params}:{params:{id:string}}) {
  const supabase=await createServerSupabaseClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user)return new NextResponse(null,{status:401})
  if(!/^[0-9a-f-]{36}$/i.test(params.id))return new NextResponse(null,{status:404})
  let path:string|null|undefined
  if(user.id===params.id){
    const {data:profile}=await supabase.from('account_profiles').select('avatar_path').eq('user_id',user.id).maybeSingle();path=profile?.avatar_path
  }else{
    const {data:viewer}=await supabase.from('community_members').select('club_access_status,club_access_expires_at').eq('user_id',user.id).maybeSingle()
    if(!hasActiveClubAccess(viewer))return new NextResponse(null,{status:403})
    const {data:member}=await supabase.from('community_members').select('avatar_path').eq('user_id',params.id).maybeSingle();path=member?.avatar_path
  }
  if(!isOwnedAvatarPath(path,params.id))return new NextResponse(null,{status:404})
  const {data,error}=await createAdminClient().storage.from('club-avatars').download(path)
  if(error||!data)return new NextResponse(null,{status:404})
  return new NextResponse(data,{headers:{'Content-Type':'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}})
}
