import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { LandingPage } from '@/components/LandingPage'
import { CourseLandingPage } from '@/components/CourseLandingPage'

const workMetadata: Metadata = {
  title: 'LegalOps Work | Vagas em Legal Ops, Legal Tech e operações jurídicas',
  description:
    'Encontre vagas em operações jurídicas, contratos, tecnologia e gestão para dar seu próximo passo profissional.',
}

const devMetadata: Metadata = {
  title: 'legalops.dev — ferramentas para o trabalho jurídico',
  description:
    'Ferramentas e guias abertos para usar, adaptar e construir com a comunidade jurídica.',
}

export const revalidate = 60

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const host = headers().get('host')?.split(':')[0].toLowerCase()
  return host === 'legalops.dev' || host === 'www.legalops.dev' ? devMetadata : workMetadata
}

export default function Home() {
  const host = headers().get('host')?.split(':')[0].toLowerCase()

  if (host === 'legalops.dev' || host === 'www.legalops.dev') {
    return <CourseLandingPage />
  }

  return <LandingPage locale="pt" />
}
