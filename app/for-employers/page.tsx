import type { Metadata } from 'next'
import { ClubHeader } from '@/components/ClubHeader'
import { EmployerHub } from '@/components/EmployerHub'

export const metadata: Metadata = {
  title: 'Empresas | LegalOps Work',
  description: 'Envie vagas de Legal Ops e encontre profissionais para escritórios de advocacia e departamentos jurídicos.',
}

export default function ForEmployersPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#20201D]">
      <ClubHeader active="employers" />
      <EmployerHub />
    </div>
  )
}
