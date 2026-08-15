import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookOpen, Network, Sparkles, UsersRound } from 'lucide-react'
import { BrandMark, BrandWordmark } from '@/components/BrandLogo'
import { ClubDiscovery } from '@/components/ClubDiscovery'
import { ClubHeader } from '@/components/ClubHeader'
import { CLUB_LAUNCH_TIERS, formatBRL } from '@/lib/club-pricing'

export const metadata: Metadata = {
  title: 'legalops.club — a comunidade de Legal Operations',
  description:
    'Uma comunidade para profissionais de Legal Ops se conectarem, compartilharem conhecimento e construírem juntos o futuro da função.',
}

const brandFont = {
  fontFamily: 'ui-rounded, "Avenir Next Rounded", "Nunito", "Quicksand", system-ui, sans-serif',
}

const pillars = [
  {
    icon: UsersRound,
    label: 'conecte',
    text: 'Encontre profissionais que lidam com os mesmos desafios que você.',
  },
  {
    icon: BookOpen,
    label: 'aprenda',
    text: 'Troque frameworks, referências, ferramentas e experiências reais.',
  },
  {
    icon: Network,
    label: 'construa',
    text: 'Transforme conversa em prática e ajude a elevar o nível de Legal Ops.',
  },
]

export default function ClubLandingPage() {
  const annualPrice = formatBRL(CLUB_LAUNCH_TIERS[0].annualPrice)

  return (
    <div className="min-h-screen bg-[#F6F0E5] text-[#111827]" style={brandFont}>
      <ClubHeader active="communities" />

      <main>
        <section className="relative overflow-hidden border-b border-[#DED7CC]">
          <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(17,24,39,.08)_0.7px,transparent_0.7px)] [background-size:20px_20px]" />
          <div className="pointer-events-none absolute -right-24 -top-32 h-[420px] w-[420px] rounded-full border-[72px] border-[#E86A4A]/[0.06]" />

          <div className="relative mx-auto grid max-w-[1180px] gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:gap-16 lg:py-28">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D9D0C3] bg-white/65 px-3 py-1.5 text-[11px] font-bold tracking-[0.12em] text-[#606560]">
                <Sparkles className="h-3.5 w-3.5 text-[#E86A4A]" />
                THE HOME FOR LEGAL OPERATIONS
              </div>

              <h1 className="mt-7 max-w-[720px] text-[42px] font-semibold leading-[0.98] tracking-[-0.065em] sm:text-[64px] lg:text-[78px]">
                conecte. aprenda. construa<span className="text-[#E86A4A]">.</span>
              </h1>

              <p className="mt-7 max-w-[650px] text-base leading-7 text-[#626762] sm:text-lg sm:leading-8">
                Uma comunidade feita para quem está construindo Legal Ops na prática — com pessoas, processos, tecnologia e contexto real.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#comunidades"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#111827] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#252D3D]"
                >
                  Explorar comunidades <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  href="/club/about"
                  className="inline-flex items-center justify-center rounded-full border border-[#CFC5B8] bg-white/65 px-5 py-3 text-sm font-bold text-[#111827] transition hover:bg-white"
                >
                  Conhecer o Club
                </Link>
              </div>

              <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-[#747975]">
                <span>comunidade</span>
                <span className="h-1 w-1 rounded-full bg-[#E86A4A]" />
                <span>conhecimento</span>
                <span className="h-1 w-1 rounded-full bg-[#E86A4A]" />
                <span>conexão</span>
              </div>
            </div>

            <div className="mx-auto w-full max-w-[500px] lg:mx-0 lg:ml-auto">
              <div className="relative overflow-hidden rounded-[34px] border border-[#D9D0C3] bg-[#111827] p-7 text-white shadow-[0_30px_70px_rgba(17,24,39,0.18)] sm:p-9">
                <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full border-[40px] border-white/[0.035]" />
                <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full border-[42px] border-[#E86A4A]/10" />

                <div className="relative">
                  <BrandMark className="h-16 w-auto text-white" />
                  <div className="mt-12">
                    <BrandWordmark
                      className="text-[38px] font-medium leading-none tracking-[-0.065em] text-white sm:text-[46px]"
                      accentClassName="text-[#E86A4A]"
                    />
                    <p className="mt-4 max-w-[330px] text-sm leading-6 text-white/65">
                      O ponto de encontro para operadores, builders e pessoas que estão transformando o jurídico.
                    </p>
                  </div>

                  <div className="mt-10 grid grid-cols-3 gap-2 border-t border-white/10 pt-5 text-[10px] font-bold tracking-[0.12em] text-white/55 sm:text-xs">
                    <span>CONNECT</span>
                    <span>LEARN</span>
                    <span>BUILD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#DED7CC] bg-[#FBF8F2]">
          <div className="mx-auto grid max-w-[1180px] gap-px px-5 py-10 sm:px-8 sm:py-14 md:grid-cols-3">
            {pillars.map(({ icon: Icon, label, text }, index) => (
              <div
                key={label}
                className={`py-6 md:px-8 md:py-4 ${index > 0 ? 'border-t border-[#E4DDD3] md:border-l md:border-t-0' : ''}`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E86A4A]/10 text-[#D9593C]">
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <h2 className="mt-5 text-xl font-semibold tracking-[-0.035em]">{label}<span className="text-[#E86A4A]">.</span></h2>
                <p className="mt-2 max-w-[310px] text-sm leading-6 text-[#696E69]">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="comunidades" className="mx-auto max-w-[1180px] scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-[720px] text-center">
            <p className="text-[11px] font-bold tracking-[0.16em] text-[#E86A4A]">ENCONTRE A SUA CONVERSA</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">Comunidades para o trabalho real.</h2>
            <p className="mx-auto mt-4 max-w-[610px] text-sm leading-6 text-[#6A6F6A] sm:text-base sm:leading-7">
              Entre pelo assunto que mais importa agora. IA, contratos, dados, processos, fornecedores, estratégia, carreira e muito mais.
            </p>
          </div>

          <div className="mt-10">
            <ClubDiscovery annualPrice={annualPrice} />
          </div>
        </section>

        <section className="px-5 pb-16 sm:px-8 sm:pb-24">
          <div className="mx-auto max-w-[1120px] overflow-hidden rounded-[30px] bg-[#111827] px-6 py-10 text-white sm:px-10 sm:py-12 md:flex md:items-center md:justify-between md:gap-10">
            <div>
              <p className="text-[11px] font-bold tracking-[0.14em] text-[#E86A4A]">LEGALOPS.CLUB</p>
              <h2 className="mt-3 max-w-[650px] text-2xl font-semibold tracking-[-0.045em] sm:text-4xl">
                Legal Ops fica melhor quando ninguém precisa construir sozinho.
              </h2>
            </div>
            <Link
              href="/login?next=/community"
              className="mt-7 inline-flex shrink-0 items-center gap-2 rounded-full bg-[#E86A4A] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#D95E41] md:mt-0"
            >
              Entrar no Club <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#DED7CC] bg-[#FBF8F2] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <BrandWordmark className="text-[21px] font-medium leading-none tracking-[-0.055em] text-[#111827]" />
          <div className="flex flex-wrap items-center gap-5 text-xs font-semibold text-[#717671]">
            <Link href="/club/about" className="hover:text-[#111827]">Sobre</Link>
            <Link href="https://legalops.work" className="hover:text-[#111827]">Vagas</Link>
            <Link href="/login?next=/community" className="hover:text-[#111827]">Entrar</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
