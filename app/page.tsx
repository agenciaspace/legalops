import type { Metadata } from 'next'
import { LandingPage } from '@/components/LandingPage'

export const metadata: Metadata = {
  title: 'LegalOps | Busque vagas, aplique e acompanhe grátis',
  description:
    'Pesquise vagas, aplique, acompanhe status e organize seu pipeline gratuitamente. Assine o Pro só se quiser recursos extras com IA e outreach.',
}

export default function Home() {
  return <LandingPage locale="pt" />
}
