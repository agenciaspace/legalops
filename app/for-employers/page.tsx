import type { Metadata } from 'next'
import { ForEmployersPage } from '@/components/ForEmployersPage'

export const metadata: Metadata = {
  title: 'LegalOps | Para Empresas — Contrate profissionais de Legal Ops',
  description:
    'Acesse o maior pool de talentos especializados em operações jurídicas. Match automático com IA. Candidatos pré-qualificados e filtrados.',
}

export default function Page() {
  return <ForEmployersPage locale="pt" />
}
