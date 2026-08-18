import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookOpen, Network, Sparkles, UsersRound } from 'lucide-react'
import { BrandWordmark } from '@/components/BrandLogo'
import { ClubDiscovery } from '@/components/ClubDiscovery'
import { ClubHeader } from '@/components/ClubHeader'
import { CLUB_LAUNCH_TIERS, formatBRL } from '@/lib/club-pricing'

export const metadata: Metadata = {
  title: 'legalops.club — a comunidade de Legal Operations',
  description:
    'Comunidade para profissionais de departamentos jurídicos, escritórios, Legal Ops e Legal Tech trocarem práticas sobre contratos, processos, dados, tecnologia e gestão.',
  openGraph: {
    title: 'legalops.club',
    description: 'conecte. aprenda. construa. — a comunidade para quem opera e transforma o jurídico.',
    url: 'https://legalops.club',
    siteName: 'legalops.club',
    type: 'website',
  },
}

const roundedFont = { fontFamily: 'var(--font-quicksand), ui-rounded, sans-serif' }
const bodyFont = { fontFamily: 'var(--font-inter), sans-serif' }

const pillars = [
  {
    icon: UsersRound,
    label: 'conecte',
    text: 'Encontre pessoas que enfrentam os mesmos desafios em contratos, intake, dados, tecnologia e gestão jurídica.',
  },
  {
    icon: BookOpen,
    label: 'aprenda',
    text: 'Troque playbooks, benchmarks, templates, ferramentas e decisões tomadas em operações jurídicas reais.',
  },
  {
    icon: Network,
    label: 'construa',
    text: 'Leve as conversas para processos, automações e formas melhores de operar o jurídico.',
  },
]

export default function ClubLandingPage() {
  const firstTier = CLUB_LAUNCH_TIERS[0]
  const annualPrice = formatBRL(firstTier.annualPrice)

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#111111]" style={bodyFont}>
      <ClubHeader active="communities" />

      <main>
        <section className="relative overflow-hidden border-b border-[#CEC8BD]">
          <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(rgba(17,17,17,.08)_0.7px,transparent_0.7px)] [background-size:20px_20px]" />
          <div className="pointer-events-none absolute -right-24 -top-32 h-[420px] w-[420px] rounded-full border-[72px] border-[#E88A6A]/[0.08]" />

          <div className="relative mx-auto grid max-w-[1180px] gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:gap-16 lg:py-28">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#CEC8BD] bg-white/55 px-3 py-1.5 text-[11px] font-bold tracking-[0.12em] text-[#66615B]">
                <Sparkles className="h-3.5 w-3.5 text-[#E88A6A]" />
                THE HOME FOR LEGAL OPERATIONS
              </div>

              <h1
                className="mt-7 max-w-[720px] text-[42px] font-semibold leading-[0.98] tracking-[-0.065em] sm:text-[64px] lg:text-[78px]"
                style={roundedFont}
              >
                conecte. aprenda. construa<span className="text-[#E88A6A]">.</span>
              </h1>

              <p className="mt-7 max-w-[650px] text-base leading-7 text-[#625E59] sm:text-lg sm:leading-8">
                Uma comunidade para profissionais de departamentos jurídicos, escritórios, Legal Ops e Legal Tech que querem melhorar como o jurídico trabalha — na prática.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#comunidades"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#111111] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#2A2927]"
                >
                  Explorar comunidades <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  href="/club/about"
                  className="inline-flex items-center justify-center rounded-full border border-[#CEC8BD] bg-white/55 px-5 py-3 text-sm font-bold text-[#111111] transition hover:bg-white"
                >
                  Conhecer o Club
                </Link>
              </div>

              <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-[#77716A]">
                <span>departamentos jurídicos</span>
                <span className="h-1 w-1 rounded-full bg-[#E88A6A]" />
                <span>escritórios</span>
                <span className="h-1 w-1 rounded-full bg-[#E88A6A]" />
                <span>legal ops & tech</span>
              </div>
            </div>

            <div className="mx-auto w-full max-w-[500px] lg:mx-0 lg:ml-auto">
              <div className="relative overflow-hidden rounded-[34px] border border-[#CEC8BD] bg-[#111111] p-7 text-white shadow-[0_30px_70px_rgba(17,17,17,0.16)] sm:p-9">
                <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full border-[40px] border-white/[0.035]" />
                <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full border-[42px] border-[#E88A6A]/10" />

                <div className="relative">
                  <p className="text-[10px] font-bold tracking-[0.16em] text-[#E88A6A]">LEGALOPS / COMMUNITY</p>
                  <div className="mt-12">
                    <BrandWordmark
                      suffix="club"
                      inverse
                      className="inline-flex items-baseline text-[35px] font-semibold leading-none tracking-[-0.055em] text-white sm:text-[43px]"
                      accentClassName="text-[#E88A6A]"
                    />
                    <p className="mt-5 max-w-[340px] text-sm leading-6 text-white/65">
                      O ponto de encontro para quem opera, lidera ou moderniza o jurídico.
                    </p>
                  </div>

                  <div className="mt-10 grid grid-cols-3 gap-2 border-t border-white/10 pt-5 text-[10px] font-bold tracking-[0.14em] text-white/55 sm:text-xs">
                    <span>CONNECT</span>
                    <span>LEARN</span>
                    <span>BUILD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#CEC8BD] bg-[#FAF7F1]">
          <div className="mx-auto grid max-w-[1180px] gap-px px-5 py-10 sm:px-8 sm:py-14 md:grid-cols-3">
            {pillars.map(({ icon: Icon, label, text }, index) => (
              <div
                key={label}
                className={`py-6 md:px-8 md:py-4 ${index > 0 ? 'border-t border-[#E6DED0] md:border-l md:border-t-0' : ''}`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E88A6A]/15 text-[#C9684F]">
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <h2 className="mt-5 text-xl font-semibold tracking-[-0.035em]" style={roundedFont}>
                  {label}<span className="text-[#E88A6A]">.</span>
                </h2>
                <p className="mt-2 max-w-[310px] text-sm leading-6 text-[#69635E]">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="comunidades" className="mx-auto max-w-[1180px] scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-[720px] text-center">
            <p className="text-[11px] font-bold tracking-[0.16em] text-[#C9684F]">ENCONTRE A SUA CONVERSA</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl" style={roundedFont}>
              Comunidades para o trabalho jurídico real.
            </h2>
            <p className="mx-auto mt-4 max-w-[610px] text-sm leading-6 text-[#6A655F] sm:text-base sm:leading-7">
              IA e automação, contratos e CLM, dados e métricas, intake, fornecedores, conhecimento, estratégia, carreira e outros temas que fazem parte da operação jurídica.
            </p>
          </div>

          <div className="mt-10">
            <ClubDiscovery annualPrice={annualPrice} />
          </div>
        </section>

        <section id="planos" className="border-y border-[#CEC8BD] bg-[#FAF7F1] px-5 py-14 sm:px-8 sm:py-18">
          <div className="mx-auto grid max-w-[1040px] gap-8 rounded-[28px] border border-[#CEC8BD] bg-white/65 p-7 sm:p-9 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-[11px] font-bold tracking-[0.14em] text-[#C9684F]">ACESSO FUNDADOR</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl" style={roundedFont}>
                {annualPrice}<span className="text-base font-medium text-[#77716A]"> / ano</span>
              </h2>
              <p className="mt-3 max-w-[650px] text-sm leading-6 text-[#69635E]">
                Primeiro lote para até {firstTier.memberTo} membros. O preço de entrada permanece nas renovações de quem entrar neste lote.
              </p>
            </div>
            <Link
              href="/login?next=/community"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#E88A6A] px-5 py-3 text-sm font-bold text-[#111111] transition hover:-translate-y-0.5 hover:bg-[#DE7B5C]"
            >
              Entrar no primeiro lote <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-[1120px] overflow-hidden rounded-[30px] bg-[#111111] px-6 py-10 text-white sm:px-10 sm:py-12 md:flex md:items-center md:justify-between md:gap-10">
            <div>
              <p className="text-[11px] font-bold tracking-[0.14em] text-[#E88A6A]">LEGALOPS.CLUB</p>
              <h2 className="mt-3 max-w-[650px] text-2xl font-semibold tracking-[-0.045em] sm:text-4xl" style={roundedFont}>
                O jurídico evolui mais rápido quando quem opera não precisa resolver tudo sozinho.
              </h2>
            </div>
            <Link
              href="/login?next=/community"
              className="mt-7 inline-flex shrink-0 items-center gap-2 rounded-full bg-[#E88A6A] px-5 py-3 text-sm font-bold text-[#111111] transition hover:-translate-y-0.5 hover:bg-[#DE7B5C] md:mt-0"
            >
              Entrar no Club <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#CEC8BD] bg-[#FAF7F1] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <BrandWordmark suffix="club" className="inline-flex items-baseline text-[23px] font-semibold leading-none tracking-[-0.055em] text-[#111111]" />
          <div className="flex flex-wrap items-center gap-5 text-xs font-semibold text-[#716B65]">
            <Link href="/club/about" className="hover:text-[#111111]">Sobre</Link>
            <Link href="https://legalops.work" className="hover:text-[#111111]">Vagas</Link>
            <Link href="/login?next=/community" className="hover:text-[#111111]">Entrar</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
