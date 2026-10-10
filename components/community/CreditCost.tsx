'use client'
import { useEffect, useState } from 'react'
import { useClubLanguage } from './ClubLanguage'
import { creditCopy } from '@/lib/club-credit-copy'
import type { CreditAction, CreditStatus } from '@/lib/club-credits'
export function CreditCost({action}:{action:CreditAction}) {
  const {locale}=useClubLanguage();const c=creditCopy(locale)
  const [status,setStatus]=useState<CreditStatus|null>(null)
  useEffect(()=>{let active=true;fetch('/api/club/credits',{cache:'no-store'}).then(async response=>{if(response.ok&&active)setStatus(await response.json())}).catch(()=>{});return()=>{active=false}},[])
  return <p className="my-2 text-xs leading-5"><a href="https://legalops.club/community/credits" className="underline">{status?`${status.costs[action]} ${c.cost}`:c.manage}</a>{status&&status.included_remaining+status.purchased<status.costs[action]&&status.api_connected?` · ${c.nextApi}`:''}</p>
}
