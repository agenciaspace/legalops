import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { LandingPage } from '@/components/LandingPage'
import { CourseLandingPage } from '@/components/CourseLandingPage'

const workMetadata: Metadata = {
  title: 'LegalOps | Vagas de Legal Ops para buscar, aplicar e acompanhar',
  description:
    'Busque vagas de Legal Ops, CLM e operações jurídicas, candidate-se e acompanhe seu pipeline gratuitamente. Assine o Pro só se quiser recursos extras com IA e outreach.',
}

const courseMetadata: Metadata = {
  title: 'legalops.dev — IA no WhatsApp, do fluxo ao sistema',
  description:
    'Uma aula aberta para construir um assistente no WhatsApp e entender a arquitetura entre canal, backend, banco de dados e modelo de IA.',
}

export const revalidate = 60

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const host = headers().get('host')?.split(':')[0].toLowerCase()
  return host === 'legalops.dev' || host === 'www.legalops.dev' ? courseMetadata : workMetadata
}

export default function Home() {
  const host = headers().get('host')?.split(':')[0].toLowerCase()

  if (host === 'legalops.dev' || host === 'www.legalops.dev') {
    return <CourseLandingPage />
  }

  return <LandingPage locale="pt" />
}
