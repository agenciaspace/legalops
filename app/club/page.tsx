import type { Metadata } from 'next'
import Link from 'next/link'
import { ClubDiscovery } from '@/components/ClubDiscovery'
import { ClubHeader } from '@/components/ClubHeader'
import { CLUB_LAUNCH_TIERS, formatBRL } from '@/lib/club-pricing'

export const metadata: Metadata = {
  title: 'Comunidades | LegalOps Club',
  description: 'Encontre grupos sobre contratos, tecnologia, dados, processos, fornecedores, estratégia e carreira em Legal Ops.',
}

export default function ClubLandingPage() {
  const annualPrice = formatBRL(CLUB_LAUNCH_TIERS[0].annualPrice)

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#20201D]">
      <ClubHeader active="communities" />

      <main className="mx-auto max-w-[1120px] px-5 pb-20 pt-14 sm:px-8 sm:pt-16">
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-[-0.03em] sm:text-4xl">Explore as comunidades</h1>
          <p className="mt-2 text-sm text-[#74746F]">
            ou{' '}
            <Link href="/club/about" className="font-medium text-[#E45220] hover:underline">
              conheça o LegalOps Club
            </Link>
          </p>
        </header>

        <div className="mt-8">
          <ClubDiscovery annualPrice={annualPrice} />
        </div>
      </main>

      <footer className="border-t border-[#E3E3DF] bg-white px-5 py-7 sm:px-8">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-3 text-xs text-[#777772] sm:flex-row sm:items-center sm:justify-between">
          <span>LegalOps Club</span>
          <div className="flex gap-5">
            <Link href="/club/about" className="hover:text-[#20201D]">Sobre</Link>
            <Link href="/login?next=/community" className="hover:text-[#20201D]">Entrar</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
