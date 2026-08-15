import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { BrandWordmark } from '@/components/BrandLogo'
import { ClubHeader } from '@/components/ClubHeader'
import { CLUB_LAUNCH_TIERS, formatBRL } from '@/lib/club-pricing'
import { COMMUNITY_CATEGORIES } from '@/lib/community'

export const metadata: Metadata = {
  title: 'Sobre — legalops.club',
  description: 'Como funcionam as comunidades, os encontros, os resumos e o acesso ao legalops.club.',
}

const brandFont = {
  fontFamily: 'ui-rounded, "Avenir Next Rounded", "Nunito", "Quicksand", system-ui, sans-serif',
}

const topicKeys = [
  'ia-automacao',
  'dados-metricas',
  'contratos-clm',
  'processos-projetos',
  'ferramentas',
  'financeiro-fornecedores',
  'governanca-conhecimento',
  'estrategia-maturidade',
  'modelos-entrega',
  'carreira',
]

const membershipIncludes = [
  {
    title: 'Grupos temáticos',
    description: 'Cada frente de trabalho tem um feed próprio para perguntas, respostas e referências.',
  },
  {
    title: 'Participação',
    description: 'Membros podem publicar, comentar, reagir e acompanhar as discussões de cada grupo.',
  },
  {
    title: 'Encontros ao vivo',
    description: 'A equipe agenda encontros para assuntos que precisam de demonstração ou de mais tempo.',
  },
  {
    title: 'Resumo semanal',
    description: 'A IA agrupa os argumentos e mantém os links para as discussões e referências citadas.',
  },
  {
    title: 'Diretório de membros',
    description: 'Os perfis verificados ajudam a identificar quem participa das conversas.',
  },
  {
    title: 'Vagas para o seu perfil',
    description: 'Os crawlers do LegalOps Work encontram vagas. O Club compara cada uma com seus objetivos, competências e modelo de trabalho.',
  },
  {
    title: 'Ajustes de currículo',
    description: 'Cada alerta mostra termos da vaga que já aparecem no seu perfil e pontos que merecem um exemplo mais concreto no CV.',
  },
]

const checkoutEnvironmentKeys: Record<string, string | undefined> = {
  founder_199: process.env.CLUB_CHECKOUT_FOUNDER_199_URL,
  founder_299: process.env.CLUB_CHECKOUT_FOUNDER_299_URL,
  pioneer_499: process.env.CLUB_CHECKOUT_PIONEER_499_URL,
  launch_699: process.env.CLUB_CHECKOUT_LAUNCH_699_URL,
}

export default function ClubAboutPage() {
  const firstTier = CLUB_LAUNCH_TIERS[0]
  const checkoutHref = checkoutEnvironmentKeys[firstTier.id] ?? '/login?next=/community'

  return (
    <div className="min-h-screen bg-[#F6F0E5] text-[#111827]" style={brandFont}>
      <ClubHeader active="about" />

      <main>
        <section className="relative overflow-hidden border-b border-[#DED7CC] px-5 py-16 sm:px-8 sm:py-24">
          <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(rgba(17,24,39,.08)_0.7px,transparent_0.7px)] [background-size:20px_20px]" />
          <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full border-[56px] border-[#E86A4A]/[0.06]" />
          <div className="relative mx-auto max-w-[980px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D9D0C3] bg-white/70 px-3 py-1.5 text-[11px] font-bold tracking-[0.12em] text-[#606560]">
              <Sparkles className="h-3.5 w-3.5 text-[#E86A4A]" /> SOBRE O CLUB
            </div>
            <h1 className="mt-6 max-w-[850px] text-4xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-6xl">
              Legal Ops fica melhor quando ninguém precisa construir sozinho<span className="text-[#E86A4A]">.</span>
            </h1>
            <p className="mt-7 max-w-3xl text-base leading-7 text-[#626762] sm:text-lg sm:leading-8">
              O legalops.club reúne profissionais para trocar experiências reais sobre processos, tecnologia, dados, contratos, fornecedores, estratégia e carreira.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/club#comunidades" className="inline-flex items-center gap-2 rounded-full bg-[#111827] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#252D3D]">
                Ver comunidades <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={checkoutHref} className="inline-flex items-center rounded-full border border-[#CFC5B8] bg-white/70 px-5 py-3 text-sm font-bold text-[#111827] transition hover:bg-white">
                Participar do primeiro lote
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-[#DED7CC] bg-[#FBF8F2] px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto grid max-w-[980px] gap-12 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <p className="text-[11px] font-bold tracking-[0.14em] text-[#E86A4A]">COMO FUNCIONA</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em]">Uma assinatura. Várias formas de participar.</h2>
              <p className="mt-5 text-sm leading-7 text-[#696E69]">
                O perfil profissional organiza sua participação no Club e também configura os alertas de vagas. Cargos, temas, ferramentas e preferências podem ser atualizados quando quiser.
              </p>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-[#DED7CC] bg-white">
              {membershipIncludes.map((item, index) => (
                <div key={item.title} className={`grid gap-3 px-5 py-5 sm:grid-cols-[2rem_11rem_1fr] sm:gap-5 ${index > 0 ? 'border-t border-[#EEE7DE]' : ''}`}>
                  <span className="text-[10px] font-bold text-[#E86A4A]">{String(index + 1).padStart(2, '0')}</span>
                  <h3 className="text-sm font-bold text-[#111827]">{item.title}</h3>
                  <p className="text-sm leading-6 text-[#696E69]">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[#DED7CC] bg-[#111827] px-5 py-16 text-white sm:px-8 sm:py-20">
          <div className="mx-auto max-w-[980px]">
            <p className="text-[11px] font-bold tracking-[0.14em] text-[#E86A4A]">UM PERFIL, TRÊS CAMADAS</p>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Perfil, comunidade e oportunidades conectados.</h2>
            <div className="mt-10 grid gap-3 md:grid-cols-3">
              {[
                ['01', 'perfil', 'Informe o que você faz e procura', 'Cargo, temas, competências, ferramentas, localidades e modelo de trabalho.'],
                ['02', 'comunidades', 'Participe dos grupos relacionados', 'Discussões, referências e encontros aprofundam os temas que fazem parte da sua rotina.'],
                ['03', 'vagas', 'Receba comparação com o seu CV', 'Os alertas mostram aderência e ajudam a identificar pontos do perfil que merecem exemplos melhores.'],
              ].map(([number, label, title, description]) => (
                <div key={label} className="rounded-[22px] border border-white/10 bg-white/[0.035] p-5">
                  <span className="text-[10px] font-bold tracking-[0.12em] text-[#E86A4A]">{number} {label.toUpperCase()}</span>
                  <h3 className="mt-4 text-base font-semibold tracking-[-0.025em]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/60">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[#DED7CC] px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto grid max-w-[980px] gap-10 md:grid-cols-[0.72fr_1.28fr]">
            <div>
              <p className="text-[11px] font-bold tracking-[0.14em] text-[#E86A4A]">ASSUNTOS</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em]">Dez comunidades no lançamento.</h2>
              <p className="mt-5 text-sm leading-7 text-[#696E69]">A estrutura acompanha o trabalho real e pode evoluir conforme o uso da comunidade.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {topicKeys.map((key, index) => (
                <Link
                  key={key}
                  href={`/community?space=${key}`}
                  className="group flex items-center gap-3 rounded-2xl border border-[#DED7CC] bg-[#FBF8F2] px-4 py-4 text-sm font-semibold text-[#111827] transition hover:-translate-y-0.5 hover:bg-white"
                >
                  <span className="text-[10px] font-bold text-[#E86A4A]">{String(index + 1).padStart(2, '0')}</span>
                  <span className="flex-1">{COMMUNITY_CATEGORIES[key].title}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#9A9D9A] transition group-hover:translate-x-0.5 group-hover:text-[#E86A4A]" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-[980px] overflow-hidden rounded-[30px] border border-[#DED7CC] bg-white shadow-[0_20px_60px_rgba(17,24,39,0.06)]">
            <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
              <div className="bg-[#F8F3EA] p-7 sm:p-9">
                <p className="text-[11px] font-bold tracking-[0.14em] text-[#E86A4A]">ACESSO FUNDADOR</p>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.055em]">{formatBRL(firstTier.annualPrice)}<span className="text-lg text-[#747975]"> / ano</span></h2>
                <p className="mt-5 text-sm leading-7 text-[#696E69]">
                  O primeiro lote tem {firstTier.memberTo} vagas. Esse preço também vale nas renovações de quem entrou nesse lote.
                </p>
                <Link href={checkoutHref} className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#E86A4A] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#D95E41]">
                  Entrar no primeiro lote <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="p-7 sm:p-9">
                <div className="flex items-end justify-between border-b border-[#E7DFD4] pb-4">
                  <h3 className="text-lg font-bold tracking-[-0.025em]">Tabela de lançamento</h3>
                  <span className="text-xs text-[#858985]">Preço anual</span>
                </div>
                <div>
                  {CLUB_LAUNCH_TIERS.map((tier, index) => (
                    <div key={tier.id} className={`grid grid-cols-[1.5rem_1fr_auto] items-center gap-4 py-5 ${index > 0 ? 'border-t border-[#EEE7DE]' : ''}`}>
                      <Check className="h-4 w-4 text-[#E86A4A]" />
                      <div>
                        <p className="text-sm font-bold">Membros {tier.memberFrom} a {tier.memberTo}</p>
                        <p className="mt-1 text-xs text-[#858985]">{tier.name}</p>
                      </div>
                      <p className="text-base font-bold">{formatBRL(tier.annualPrice)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#DED7CC] bg-[#FBF8F2] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-[980px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <BrandWordmark className="text-[21px] font-medium leading-none tracking-[-0.055em] text-[#111827]" />
          <p className="max-w-[620px] text-xs leading-5 text-[#777B78] sm:text-right">
            Comunidade independente, sem afiliação com a CLOC. O{' '}
            <a href="https://cloc.org/cloc-core-12/" target="_blank" rel="noreferrer" className="underline underline-offset-3 hover:text-[#111827]">Core 12</a>{' '}
            é uma referência para a organização dos temas.
          </p>
        </div>
      </footer>
    </div>
  )
}
