import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { hasActiveClubAccess } from '@/lib/community'
import { MAX_AVATAR_BYTES, isOwnedAvatarPath, validAvatarJpeg } from '@/lib/club-avatar'
export const dynamic='force-dynamic'
export async function DELETE() {
  const supabase=await createServerSupabaseClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user)return NextResponse.json({error:'Entre na sua conta.'},{status:401})
  const [{data:member},{data:profile}]=await Promise.all([
    supabase.from('community_members').select('club_access_status,club_access_expires_at').eq('user_id',user.id).maybeSingle(),
    supabase.from('account_profiles').select('avatar_path').eq('user_id',user.id).maybeSingle(),
  ])
  if(hasActiveClubAccess(member))return NextResponse.json({error:'A foto é obrigatória. Envie outra imagem para substituí-la.'},{status:409})
  try {
    const admin=createAdminClient()
    if(isOwnedAvatarPath(profile?.avatar_path,user.id)) {
      const {error}=await admin.storage.from('club-avatars').remove([profile.avatar_path])
      if(error)throw error
    }
    const {error}=await admin.from('account_profiles').update({avatar_path:null}).eq('user_id',user.id)
    if(error)throw error
    return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}})
  }catch{return NextResponse.json({error:'Não conseguimos remover sua foto. Tente novamente.'},{status:503})}
}
export async function POST(request:NextRequest) {
  const supabase=await createServerSupabaseClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user)return NextResponse.json({error:'Entre na sua conta.'},{status:401})
  const {data:profile}=await supabase.from('account_profiles').select('avatar_path').eq('user_id',user.id).maybeSingle()
  if(!profile)return NextResponse.json({error:'Não encontramos seu perfil. Atualize a página e tente novamente.'},{status:409})
  if(request.headers.get('content-type')!=='image/jpeg')return NextResponse.json({error:'Selecione uma foto pelo formulário.'},{status:415})
  if(Number(request.headers.get('content-length'))>MAX_AVATAR_BYTES)return NextResponse.json({error:'A foto ficou muito grande.'},{status:413})
  try {
    const reader=request.body?.getReader();if(!reader)return NextResponse.json({error:'Selecione uma foto.'},{status:400})
    const chunks:Uint8Array[]=[];let size=0
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_AVATAR_BYTES){await reader.cancel();return NextResponse.json({error:'A foto ficou muito grande.'},{status:413})}chunks.push(value)}
    const bytes=Buffer.concat(chunks)
    if(!validAvatarJpeg(bytes))return NextResponse.json({error:'Não conseguimos ler essa foto. Escolha outra imagem.'},{status:400})
    const admin=createAdminClient();const path=`${user.id}/${randomUUID()}.jpg`
    const {error:uploadError}=await admin.storage.from('club-avatars').upload(path,bytes,{contentType:'image/jpeg',upsert:false})
    if(uploadError)throw new Error('upload failed')
    const {data:saved,error}=await admin.from('account_profiles').update({avatar_path:path}).eq('user_id',user.id).select('user_id').maybeSingle()
    if(error||!saved){await admin.storage.from('club-avatars').remove([path]);throw new Error('profile update failed')}
    if(isOwnedAvatarPath(profile.avatar_path,user.id))await admin.storage.from('club-avatars').remove([profile.avatar_path])
    return NextResponse.json({url:`/api/club/avatar/${user.id}?v=${path.split('/')[1]}`},{headers:{'Cache-Control':'no-store'}})
  }catch{return NextResponse.json({error:'Não conseguimos salvar sua foto. Tente novamente.'},{status:503})}
}
