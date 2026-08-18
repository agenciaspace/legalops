import type { Metadata } from 'next'
import { ClubHeader } from '@/components/ClubHeader'
import { EmployerHub } from '@/components/EmployerHub'

export const metadata: Metadata = {
  title: 'Contratação para operações jurídicas | LegalOps Work',
  description: 'Publique vagas e encontre profissionais de Legal Ops, Legal Tech, contratos, CLM, dados, operações e gestão para escritórios e departamentos jurídicos.',
}

export default function ForEmployersPage() {
  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#111111]">
      <ClubHeader active="employers" />
      <EmployerHub />
    </div>
  )
}
