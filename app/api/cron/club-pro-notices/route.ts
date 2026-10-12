import { NextRequest, NextResponse } from 'next/server'
import { deliverProNotices } from '@/lib/club-pro-notices'
export const maxDuration=60
export async function GET(request:NextRequest) {
  const secret=process.env.CRON_SECRET
  if(!secret || request.headers.get('authorization')!==`Bearer ${secret}`)return NextResponse.json({error:'Unauthorized'},{status:401})
  try { return NextResponse.json(await deliverProNotices()) }
  catch { return NextResponse.json({error:'pro_notices_unavailable'},{status:503}) }
}
