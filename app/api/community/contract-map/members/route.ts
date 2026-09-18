import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { hasActiveClubAccess } from '@/lib/community'
import { isDirectoryMember } from '@/lib/community-directory'
export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
 const db=await createServerSupabaseClient(); const {data:{user}}=await db.auth.getUser()
 if (!user) return NextResponse.json({error:'Entre na comunidade.'},{status:401})
 const {data:member}=await db.from('community_members').select('club_access_status,club_access_expires_at').eq('user_id',user.id).maybeSingle()
 if (!hasActiveClubAccess(member)) return NextResponse.json({error:'Acesso restrito a membros.'},{status:403})
 const q=(new URL(request.url).searchParams.get('q')??'').slice(0,60).replace(/[%_\\]/g,'')
 const {data,error}=await db.from('community_members').select('user_id,display_name,current_role,organization_name,club_access_status,club_access_expires_at').ilike('display_name',`%${q}%`).order('display_name').limit(40)
 if (error) return NextResponse.json({error:'Não foi possível buscar membros.'},{status:503})
 return NextResponse.json({members:(data??[]).filter(isDirectoryMember).slice(0,10).map(({user_id,display_name})=>({user_id,display_name}))},{headers:{'Cache-Control':'private, no-store'}})
}
