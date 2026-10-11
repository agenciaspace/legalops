import { NextResponse } from 'next/server'
import { CreditError } from './club-credits'
import { MemberKeyError } from './club-api-key'
import { creditErrorMessage } from './club-credit-copy'
import { memberKeyErrorMessage } from './club-api-key-copy'
import { normalizeClubLocale } from './club-locale'
export function creditFailureResponse(error:unknown,request:Request){
  const locale=normalizeClubLocale(request.headers.get('x-club-locale'))
  if(error instanceof CreditError)return NextResponse.json({error:creditErrorMessage(error.code,locale),code:error.code},{status:error.status})
  if(error instanceof MemberKeyError)return NextResponse.json({error:memberKeyErrorMessage(error.code,locale)},{status:error.status})
  return NextResponse.json({error:'Não conseguimos concluir a geração. Os créditos reservados serão devolvidos.'},{status:503})
}
export function validCreditOrigin(request:Request){return request.headers.get('origin')===new URL(request.url).origin&&request.headers.get('sec-fetch-site')!=='cross-site'}
