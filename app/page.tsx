import type { Metadata } from 'next'
import { LandingPage } from '@/components/LandingPage'

export const metadata: Metadata = {
  title: 'LegalOps | Vagas de Legal Ops para buscar, aplicar e acompanhar',
  description:
    'Busque vagas de Legal Ops, CLM e operações jurídicas, candidate-se e acompanhe seu pipeline gratuitamente. Assine o Pro só se quiser recursos extras com IA e outreach.',
}

export default function Home() {
  return <LandingPage locale="pt" />
}
