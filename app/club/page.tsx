import type { Metadata } from 'next'
import { ResumeClubSession } from '@/components/community/ResumeClubSession'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { ProOffer } from '@/lib/club-pro'
import ClubEditorialHome from './ClubEditorialHome'

export const metadata: Metadata = {
  title: 'legalops.club | comunidade para o trabalho jurídico',
  description: 'Troque experiências, conheça profissionais e participe das conversas e encontros do legalops.club. Conheça também o Club Pro.',
  openGraph: { title: 'legalops.club | o jurídico avança quando a gente troca', description: 'Uma comunidade para trocar experiências e conversar sobre os desafios reais do trabalho jurídico.', url: 'https://legalops.club', siteName: 'legalops.club', type: 'website' },
}
export const dynamic = 'force-dynamic'

async function loadOffer(): Promise<ProOffer | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null
  const db = await createServerSupabaseClient()
  const { data, error } = await db.from('club_pro_offer')
    .select('price_cents,period_months,active,payment_mode,payment_url,trial_days')
    .eq('id', true).abortSignal(AbortSignal.timeout(2500)).maybeSingle()
  return error ? null : data
}

export default async function ClubLandingPage() {
  const offer = await loadOffer().catch(() => null)
  return <><ResumeClubSession /><ClubEditorialHome offer={offer} /></>
}
