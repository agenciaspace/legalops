import { NextResponse } from 'next/server'
import { agentSession } from '@/lib/club-agent-access'
import { getCreditStatus } from '@/lib/club-credits'
export async function GET(){
  const access=await agentSession();if(access.error)return access.error
  try{return NextResponse.json(await getCreditStatus(access.user.id),{headers:{'Cache-Control':'private, no-store'}})}
  catch{return NextResponse.json({error:'CREDITS_UNAVAILABLE'},{status:503})}
}
