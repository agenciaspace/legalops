import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookOpen, MessageCircle, UsersRound } from 'lucide-react'
import { BrandWordmark } from '@/components/BrandLogo'
import { ClubDiscovery } from '@/components/ClubDiscovery'
import { ClubHeader } from '@/components/ClubHeader'
import { LegalOpsEcosystem } from '@/components/LegalOpsEcosystem'
import { CLUB_LAUNCH_TIERS, formatBRL } from '@/lib/club-pricing'

export const metadata: Metadata = {
  title: 'legalops.club — comunidade para profissionais do jurídico',
  description:
    'Comunidade para profissionais de departamentos jurídicos, escritórios, Legal Ops e Legal Tech trocarem práticas, referências, ferramentas e experiências.',
  openGraph: {
    title: 'legalops.club',
    description: 'A comunidade para quem faz o jurídico acontecer.',
    url: 'https://legalops.club',
    siteName: 'legalops.club',
    type: 'website',
  },
}

const roundedFont = { fontFamily: 'var(--font-quicksand), ui-rounded, sans-serif' }
const bodyFont = { fontFamily: 'var(--font-inter), sans-serif' }

const pillars = [
  {
    icon: MessageCircle,
    label: 'converse',
    text: 'Traga uma dúvida, um problema ou uma decisão e compare caminhos com quem enfrenta situações parecidas.',
  },
  {
    icon: BookOpen,
    label: 'compartilhe',
    text: 'Troque playbooks, benchmarks, templates, ferramentas e aprendizados de operações jurídicas reais.',
  },
  {
    icon: UsersRound,
    label: 'encontre pessoas',
    text: 'Conheça profissionais de departamentos jurídicos, escritórios, Legal Ops e Legal Tech.',
  },
]

function ClubProductPreview() {
  const topics = [
    ['contratos & CLM', 'processo, adoção e dados'],
    ['IA & automação', 'casos de uso e governança'],
    ['carreira', 'times, liderança e oportunidades'],
  ]

  return (
    <div className="border border-[#BEB7AA] bg-[#FAF7F1]">
      <div className="flex items-center justify-between border-b border-[#CEC8BD] px-4 py-3">
        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#C9684F]">preview do club</span>
        <span className="text-[10px] font-semibold text-[#817A73]">comunidade + escritório</span>
      </div>
      <div className="grid sm:grid-cols-[1.06fr_.94fr]">
        <div className="p-4 sm:border-r sm:border-[#CEC8BD]">
          <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#817A73]">conversas</p>
          <div className="mt-3 border-t border-[#CEC8BD]">
            {topics.map(([title, copy], index) => (
              <div key={title} className="grid grid-cols-[28px_1fr] gap-2 border-b border-[#E6DED0] py-3">
                <span className="text-[9px] font-bold text-[#C9684F]">0{index + 1}</span>
                <div>
                  <p className="text-xs font-semibold text-[#111111]">{title}</p>
                  <p className="mt-0.5 text-[10px] leading-4 text-[#817A73]">{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-[#CEC8BD] p-4 sm:border-t-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#817A73]">escritório virtual</p>
          <div className="relative mt-3 h-[154px] overflow-hidden border border-[#D8D2C7] bg-[#EEE8DC]">
            <div className="absolute left-[12%] top-[20%] h-7 w-14 border border-[#B6AEA1] bg-[#D6C8B8]" />
            <div className="absolute right-[12%] top-[20%] h-7 w-14 border border-[#B6AEA1] bg-[#D6C8B8]" />
            <div className="absolute bottom-[18%] left-[12%] h-7 w-14 border border-[#B6AEA1] bg-[#D6C8B8]" />
            <div className="absolute bottom-[18%] right-[12%] h-7 w-14 border border-[#B6AEA1] bg-[#D6C8B8]" />
            <div className="absolute left-[31%] top-[27%] flex h-7 w-7 items-center justify-center border-2 border-[#C9684F] bg-[#E88A6A] text-[8px] font-black text-[#111111]">LO</div>
            <div className="absolute right-[30%] top-[44%] flex h-7 w-7 items-center justify-center border-2 border-[#111111] bg-[#F5F1E8] text-[8px] font-black">LT</div>
            <div className="absolute bottom-[22%] left-[43%] flex h-7 w-7 items-center justify-center border-2 border-[#111111] bg-[#F5F1E8] text-[8px] font-black">JR</div>
          </div>
          <p className="mt-3 text-[10px] leading-4 text-[#69635E]">Entre, veja quem está por aqui e trabalhe em companhia sem precisar marcar uma call.</p>
        </div>
      </div>
    </div>
  )
}

export default function ClubLandingPage() {
  const firstTier = CLUB_LAUNCH_TIERS[0]
  const annualPrice = formatBRL(firstTier.annualPrice)

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#111111]" style={bodyFont}>
      <ClubHeader active="communities" />

      <main>
        <section className="border-b border-[#CEC8BD]">
          <div className="mx-auto grid max-w-[1180px] gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.03fr_.97fr] lg:items-center lg:gap-16 lg:py-28">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#C9684F]">legalops.club / comunidade</p>
              <h1
                className="mt-5 max-w-[720px] text-[42px] font-semibold leading-[0.98] tracking-[-0.065em] sm:text-[62px] lg:text-[72px]"
                style={roundedFont}
              >
                troque com quem vive os mesmos problemas do jurídico<span className="text-[#E88A6A]">.</span>
              </h1>
              <p className="mt-6 max-w-[650px] text-base leading-7 text-[#625E59] sm:text-lg sm:leading-8">
                Uma comunidade para profissionais do jurídico encontrarem pessoas, referências e experiências que ajudam no trabalho real — de contratos e dados a tecnologia, gestão e carreira.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#comunidades"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#111111] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#2A2927]"
                >
                  Explorar a comunidade <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  href="/login?next=/community/office"
                  className="inline-flex items-center justify-center rounded-lg border border-[#BEB7AA] px-5 py-3 text-sm font-bold text-[#111111] transition hover:bg-[#FAF7F1]"
                >
                  Conhecer o escritório virtual
                </Link>
              </div>
            </div>

            <ClubProductPreview />
          </div>
        </section>

        <LegalOpsEcosystem active="club" />

        <section className="border-b border-[#CEC8BD] bg-[#FAF7F1]">
          <div className="mx-auto grid max-w-[1180px] px-5 sm:px-8 md:grid-cols-3">
            {pillars.map(({ icon: Icon, label, text }, index) => (
              <div
                key={label}
                className={`py-10 md:px-8 md:py-14 ${index > 0 ? 'border-t border-[#E6DED0] md:border-l md:border-t-0' : ''}`}
              >
                <Icon className="h-5 w-5 text-[#C9684F]" />
                <h2 className="mt-8 text-xl font-semibold tracking-[-0.035em]" style={roundedFont}>
                  {label}<span className="text-[#E88A6A]">.</span>
                </h2>
                <p className="mt-2 max-w-[310px] text-sm leading-6 text-[#69635E]">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="comunidades" className="mx-auto max-w-[1180px] scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
          <div className="grid gap-6 border-b border-[#CEC8BD] pb-10 md:grid-cols-[.8fr_1.2fr] md:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C9684F]">dentro do club</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl" style={roundedFont}>
                encontre a conversa certa<span className="text-[#E88A6A]">.</span>
              </h2>
            </div>
            <p className="max-w-[620px] text-sm leading-6 text-[#6A655F] sm:text-base sm:leading-7">
              IA e automação, contratos e CLM, dados e métricas, intake, fornecedores, conhecimento, estratégia, carreira e outros temas do trabalho jurídico.
            </p>
          </div>

          <div className="mt-10">
            <ClubDiscovery annualPrice={annualPrice} />
          </div>
        </section>

        <section id="planos" className="border-y border-[#CEC8BD] bg-[#FAF7F1]">
          <div className="mx-auto grid max-w-[1040px] gap-8 px-5 py-14 sm:px-8 md:grid-cols-[1fr_auto] md:items-end md:py-18">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#C9684F]">acesso fundador</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl" style={roundedFont}>
                {annualPrice}<span className="text-base font-medium text-[#77716A]"> / ano</span>
              </h2>
              <p className="mt-3 max-w-[650px] text-sm leading-6 text-[#69635E]">
                Primeiro lote para até {firstTier.memberTo} membros. Quem entra neste lote mantém o preço de entrada nas renovações.
              </p>
            </div>
            <Link
              href="/club/checkout"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#111111] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#2A2927]"
            >
              Participar do Club <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1180px] gap-8 px-5 py-16 sm:px-8 sm:py-24 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#C9684F]">legalops.club / comunidade</p>
            <h2 className="mt-3 max-w-[720px] text-3xl font-semibold tracking-[-0.05em] sm:text-5xl" style={roundedFont}>
              não resolva sozinho o que a comunidade pode ajudar a destravar<span className="text-[#E88A6A]">.</span>
            </h2>
          </div>
          <Link href="/club/checkout" className="inline-flex items-center gap-2 border-b border-[#111111] pb-1 text-sm font-bold hover:text-[#C9684F]">
            Participar da comunidade <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>

      <footer className="border-t border-[#CEC8BD] bg-[#FAF7F1] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <BrandWordmark suffix="club" className="inline-flex items-baseline text-[23px] font-semibold leading-none tracking-[-0.055em] text-[#111111]" />
          <div className="flex flex-wrap items-center gap-5 text-xs font-semibold text-[#716B65]">
            <Link href="https://legalops.work" className="hover:text-[#111111]">work / vagas</Link>
            <Link href="https://legalops.dev" className="hover:text-[#111111]">dev / construir</Link>
            <Link href="/club/about" className="hover:text-[#111111]">Sobre</Link>
            <Link href="/login?next=/community" className="hover:text-[#111111]">Entrar</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
