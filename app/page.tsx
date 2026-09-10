import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { LandingPage } from '@/components/LandingPage'
import { CourseLandingPage } from '@/components/CourseLandingPage'

const workMetadata: Metadata = {
  title: 'LegalOps Work | Vagas em Legal Ops, Legal Tech e operações jurídicas',
  description:
    'Encontre oportunidades verificadas em Legal Ops, Legal Tech, contratos, CLM, dados, inovação e gestão jurídica em departamentos jurídicos, escritórios e empresas de tecnologia.',
}

const devMetadata: Metadata = {
  title: 'legalops.dev — open source Legal Tech',
  description:
    'Open source Legal Tech, built by the people who run Legal. Produtos jurídicos abertos para usar, adaptar e construir em comunidade.',
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
