import type { Metadata } from 'next'
import { ClubHeader } from '@/components/ClubHeader'
import { EmployerHub } from '@/components/EmployerHub'

export const metadata: Metadata = {
  title: 'Empresas | LegalOps Work',
  description: 'Envie vagas de Legal Ops e encontre profissionais para escritórios de advocacia e departamentos jurídicos.',
}

export default function ForEmployersPage() {
  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#111111]">
      <ClubHeader active="employers" />
      <EmployerHub />
    </div>
  )
}
