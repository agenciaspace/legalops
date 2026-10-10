// Server-only wallet operations. All prices and funding decisions come from PostgreSQL.
import { createAdminClient } from './supabase-admin'
import { generateOpenRouterText } from './openrouter'
import { generateMemberOpenAIText, loadMemberKey, MemberKeyError } from './club-api-key'
export type CreditAction = 'agent_question' | 'agent_summary' | 'personalized_cv' | 'cover_letter' | 'interview_prep' | 'linkedin_insights'
export type CreditReservation = { id: string; funding: 'club' | 'api'; cost: number }
export class CreditError extends Error {
  constructor(public code: string, public status = 503) { super(code) }
}
export function creditError(error: unknown) {
  const message = error instanceof Error ? error.message : String((error as {message?:string})?.message ?? '')
  for (const [code,status] of [['INSUFFICIENT_CREDITS',402],['PRO_REQUIRED',403],['QUESTION_IN_PROGRESS',429]] as const) {
    if (message.includes(code)) return new CreditError(code,status)
  }
  return new CreditError('CREDITS_UNAVAILABLE')
}
export async function getCreditStatus(userId: string) {
  const admin = createAdminClient()
  const {error:recoveryError}=await admin.rpc('recover_club_credits',{member_id:userId})
  if(recoveryError)throw new CreditError('CREDITS_UNAVAILABLE')
  const {data:settings,error} = await admin.from('club_credit_settings').select('*').eq('id',true).single()
  if (error || !settings) throw new CreditError('CREDITS_UNAVAILABLE')
  const day = new Date().toISOString().slice(0,10)
  const start = settings.period === 'month' ? day.slice(0,7)+'-01' : day
  const results = await Promise.all([
    admin.from('club_credit_periods').select('used').eq('user_id',userId).eq('period',settings.period).eq('starts_on',start).maybeSingle(),
    admin.from('club_credit_wallets').select('purchased').eq('user_id',userId).maybeSingle(),
    admin.from('club_credit_costs').select('action,credits'),
    admin.from('club_member_api_keys').select('user_id').eq('user_id',userId).maybeSingle(),
  ])
  if (results.some(result=>result.error)) throw new CreditError('CREDITS_UNAVAILABLE')
  const used = results[0].data?.used ?? 0
  return { allowance: settings.allowance, period: settings.period as 'day'|'month', used,
    included_remaining: Math.max(0,settings.allowance-used), purchased: results[1].data?.purchased ?? 0,
    api_connected: Boolean(results[3].data), costs: Object.fromEntries((results[2].data??[]).map(row=>[row.action,row.credits])) as Record<CreditAction,number>,
    pack_credits:settings.pack_credits,pack_price_cents:settings.pack_price_cents,sales_active:settings.sales_active }
}
export type CreditStatus = Awaited<ReturnType<typeof getCreditStatus>>
export async function generateCreditText(userId: string, reservation: CreditReservation, prompt: Parameters<typeof generateOpenRouterText>[0]) {
  if (reservation.funding==='api') {
    const key = await loadMemberKey(userId)
    if (!key) throw new MemberKeyError('invalid_api_key',422)
    return generateMemberOpenAIText(key,{...prompt,systemPrompt:prompt.systemPrompt??''})
  }
  if (reservation.funding!=='club') throw new CreditError('CREDITS_UNAVAILABLE')
  const text=await generateOpenRouterText(prompt)
  if(!text.trim())throw new CreditError('EMPTY_GENERATION')
  return text
}
export async function withCreditAction<T>(userId: string, action: CreditAction, run: (generate: (prompt: Parameters<typeof generateOpenRouterText>[0])=>Promise<string>, reservation: CreditReservation)=>Promise<T>) {
  const admin=createAdminClient()
  const {data:reservation,error}=await admin.rpc('reserve_club_credits',{member_id:userId,action_name:action})
  if(error||!reservation?.id) throw creditError(error)
  try {
    const result=await run(prompt=>generateCreditText(userId,reservation,prompt),reservation)
    const {error:finishError}=await admin.rpc('finish_club_credits',{transaction_id:reservation.id,failed:false})
    if(finishError)throw new CreditError('CREDITS_UNAVAILABLE')
    return result
  } catch(error) {
    await admin.rpc('finish_club_credits',{transaction_id:reservation.id,failed:true})
    throw error
  }
}
