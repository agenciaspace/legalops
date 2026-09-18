import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
export const dynamic = 'force-dynamic'
export async function GET() {
 const db=await createServerSupabaseClient();const {data:{user}}=await db.auth.getUser()
 if (!user) return NextResponse.json({error:'Unauthorized'},{status:401})
 // RLS also requires current membership and ownership.
 const {data,error}=await db.from('contract_map_notifications').select('id,section_id,contribution_id,preview,created_at,read_at').eq('recipient_id',user.id).is('read_at',null).order('created_at',{ascending:false}).limit(30)
 return NextResponse.json(error?{error:'Notificações indisponíveis.'}:{notifications:data},{status:error?503:200,headers:{'Cache-Control':'private, no-store'}})
}
export async function PATCH(request: Request) {
 const db=await createServerSupabaseClient();const {data:{user}}=await db.auth.getUser()
 if (!user) return NextResponse.json({error:'Unauthorized'},{status:401})
 let value;try {value=await request.json()}catch{return NextResponse.json({error:'Dados inválidos.'},{status:400})}
 if (typeof value?.id!=='string'||!/^[0-9a-f-]{36}$/i.test(value.id))return NextResponse.json({error:'Dados inválidos.'},{status:400})
 const {error}=await db.from('contract_map_notifications').update({read_at:new Date().toISOString()}).eq('id',value.id).eq('recipient_id',user.id)
 return NextResponse.json({ok:!error},{status:error?400:200,headers:{'Cache-Control':'private, no-store'}})
}
