import type { Metadata } from 'next'
import { ResumeClubSession } from '@/components/community/ResumeClubSession'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { ProOffer } from '@/lib/club-pro'
import ClubEditorialHome from './ClubEditorialHome'

export const metadata: Metadata = {
  title: 'Club Pro | prepare seu próximo passo no jurídico',
  description: 'Encontre oportunidades, prepare sua candidatura e pratique entrevistas com o Club Pro. Conheça o plano e as condições para começar.',
  openGraph: { title: 'Club Pro | da vaga à entrevista, com mais preparo', description: 'Assistente privado, recursos de carreira e apoio na primeira tarefa. Conheça o Club Pro.', url: 'https://legalops.club', siteName: 'legalops.club', type: 'website' },
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
