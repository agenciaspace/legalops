import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react'
import { ClubHeader } from '@/components/ClubHeader'
import { PixCheckoutCard } from '@/components/PixCheckoutCard'
import { CLUB_LAUNCH_TIERS } from '@/lib/club-pricing'

export const metadata: Metadata = {
  title: 'Entrar no Club — pagamento por PIX',
  description: 'Pagamento por PIX para o acesso fundador do legalops.club.',
  robots: { index: false, follow: false },
}

const roundedFont = { fontFamily: 'var(--font-quicksand), ui-rounded, sans-serif' }
const bodyFont = { fontFamily: 'var(--font-inter), sans-serif' }

export default function ClubCheckoutPage() {
  const founderTier = CLUB_LAUNCH_TIERS[0]

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#111111]" style={bodyFont}>
      <ClubHeader active="communities" />

      <main className="mx-auto grid max-w-[1080px] gap-10 px-5 py-12 sm:px-8 sm:py-20 lg:grid-cols-[1fr_460px] lg:items-start lg:gap-16">
        <section className="pt-2">
          <Link href="/club" className="inline-flex items-center gap-2 text-xs font-bold text-[#77716A] hover:text-[#111111]">
            <ArrowLeft className="h-4 w-4" /> Voltar ao Club
          </Link>
          <p className="mt-10 text-[10px] font-bold uppercase tracking-[0.17em] text-[#C9684F]">legalops.club / checkout</p>
          <h1 className="mt-4 max-w-[620px] text-4xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-6xl" style={roundedFont}>
            entre no primeiro lote por PIX<span className="text-[#E88A6A]">.</span>
          </h1>
          <p className="mt-6 max-w-[610px] text-base leading-7 text-[#625E59]">
            Faça o pagamento pela chave ao lado e envie o comprovante. Depois da conferência, você recebe por email o convite para criar a senha e completar seu perfil.
          </p>

          <div className="mt-9 space-y-4 border-t border-[#CEC8BD] pt-7">
            {[
              'Abra o PIX no aplicativo do seu banco e escolha pagar com chave email.',
              `Transfira o valor exato de R$ ${founderTier.annualPrice.toLocaleString('pt-BR')}. Antes de confirmar, confira o nome do recebedor mostrado pelo banco.`,
              'Envie o comprovante e informe qual email deverá receber o acesso.',
            ].map((step, index) => (
              <div key={step} className="grid grid-cols-[28px_1fr] gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#CEC8BD] bg-white text-[10px] font-bold text-[#C9684F]">{index + 1}</span>
                <p className="pt-0.5 text-sm leading-6 text-[#69635E]">{step}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex gap-3 rounded-2xl border border-[#CEC8BD] bg-[#FAF7F1] p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#C9684F]" />
            <p className="text-xs leading-5 text-[#69635E]">
              A ativação é manual. O comprovante serve apenas para localizar o pagamento; nunca envie senha, código do banco ou outros dados financeiros.
            </p>
          </div>

          <Link href="/login?next=/community" className="mt-8 inline-flex items-center gap-2 text-xs font-bold text-[#625E59] hover:text-[#111111]">
            <CheckCircle2 className="h-4 w-4" /> Já sou membro — entrar
          </Link>
        </section>

        <PixCheckoutCard amount={founderTier.annualPrice} />
      </main>
    </div>
  )
}
