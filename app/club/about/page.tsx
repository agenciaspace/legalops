import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { BrandWordmark } from '@/components/BrandLogo'
import { ClubHeader } from '@/components/ClubHeader'
import { CLUB_LAUNCH_TIERS, formatBRL } from '@/lib/club-pricing'
import { COMMUNITY_CATEGORIES } from '@/lib/community'

export const metadata: Metadata = {
  title: 'Sobre — legalops.club',
  description: 'Comunidade para profissionais do jurídico trocarem práticas sobre Legal Ops, Legal Tech, contratos, processos, dados, tecnologia, gestão e carreira.',
}

const roundedFont = { fontFamily: 'var(--font-quicksand), ui-rounded, sans-serif' }
const bodyFont = { fontFamily: 'var(--font-inter), sans-serif' }

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
  { title: 'Grupos temáticos', description: 'Cada frente da operação jurídica tem um feed próprio para perguntas, respostas, referências, playbooks e benchmarks.' },
  { title: 'Participação', description: 'Membros podem publicar, comentar, reagir e acompanhar discussões sobre problemas que aparecem no trabalho jurídico real.' },
  { title: 'Encontros ao vivo', description: 'Encontros para demonstrações, casos práticos e conversas que precisam de mais contexto do que um post.' },
  { title: 'Resumo semanal', description: 'A IA organiza os principais argumentos e mantém os links para as discussões, materiais e referências citadas.' },
  { title: 'Diretório de membros', description: 'Perfis verificados ajudam a encontrar quem trabalha com temas, ferramentas e contextos jurídicos semelhantes aos seus.' },
  { title: 'Vagas para o seu perfil', description: 'O LegalOps Work encontra oportunidades em Legal Ops, Legal Tech, contratos, dados e operações e compara cada uma com o seu perfil.' },
  { title: 'Ajustes de currículo', description: 'Cada alerta destaca requisitos presentes na vaga e pontos do seu histórico que merecem exemplos mais concretos no CV.' },
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
    <div className="min-h-screen bg-[#F5F1E8] text-[#111111]" style={bodyFont}>
      <ClubHeader active="about" />

      <main>
        <section className="relative overflow-hidden border-b border-[#CEC8BD] px-5 py-16 sm:px-8 sm:py-24">
          <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:radial-gradient(rgba(17,17,17,.08)_0.7px,transparent_0.7px)] [background-size:20px_20px]" />
          <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full border-[56px] border-[#E88A6A]/[0.08]" />
          <div className="relative mx-auto max-w-[980px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#CEC8BD] bg-white/60 px-3 py-1.5 text-[11px] font-bold tracking-[0.12em] text-[#66615B]">
              <Sparkles className="h-3.5 w-3.5 text-[#E88A6A]" /> SOBRE O CLUB
            </div>
            <h1 className="mt-6 max-w-[850px] text-4xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-6xl" style={roundedFont}>
              Um lugar para quem quer fazer o jurídico funcionar melhor<span className="text-[#E88A6A]">.</span>
            </h1>
            <p className="mt-7 max-w-3xl text-base leading-7 text-[#625E59] sm:text-lg sm:leading-8">
              O legalops.club reúne profissionais de departamentos jurídicos, escritórios, Legal Ops e Legal Tech para trocar experiências reais sobre contratos, processos, dados, tecnologia, fornecedores, conhecimento, estratégia e carreira.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/club#comunidades" className="inline-flex items-center gap-2 rounded-full bg-[#111111] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#2A2927]">
                Ver comunidades <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={checkoutHref} className="inline-flex items-center rounded-full border border-[#CEC8BD] bg-white/60 px-5 py-3 text-sm font-bold text-[#111111] transition hover:bg-white">
                Participar do primeiro lote
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-[#CEC8BD] bg-[#FAF7F1] px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto grid max-w-[980px] gap-12 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <p className="text-[11px] font-bold tracking-[0.14em] text-[#C9684F]">COMO FUNCIONA</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em]" style={roundedFont}>Uma assinatura para aprender, trocar e avançar no trabalho jurídico.</h2>
              <p className="mt-5 text-sm leading-7 text-[#69635E]">
                Seu perfil organiza os temas que você acompanha, conecta você a profissionais com desafios semelhantes e também configura alertas de oportunidades. Cargo, competências, ferramentas e preferências podem ser atualizados quando quiser.
              </p>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-[#CEC8BD] bg-white">
              {membershipIncludes.map((item, index) => (
                <div key={item.title} className={`grid gap-3 px-5 py-5 sm:grid-cols-[2rem_11rem_1fr] sm:gap-5 ${index > 0 ? 'border-t border-[#E6DED0]' : ''}`}>
                  <span className="text-[10px] font-bold text-[#C9684F]">{String(index + 1).padStart(2, '0')}</span>
                  <h3 className="text-sm font-bold text-[#111111]">{item.title}</h3>
                  <p className="text-sm leading-6 text-[#69635E]">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[#CEC8BD] bg-[#111111] px-5 py-16 text-white sm:px-8 sm:py-20">
          <div className="mx-auto max-w-[980px]">
            <p className="text-[11px] font-bold tracking-[0.14em] text-[#E88A6A]">UM PERFIL, TRÊS CAMADAS</p>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.045em] sm:text-4xl" style={roundedFont}>Conhecimento, comunidade e oportunidades no mesmo contexto.</h2>
            <div className="mt-10 grid gap-3 md:grid-cols-3">
              {[
                ['01', 'perfil', 'Mostre o que você faz e quer aprender', 'Cargo, temas, competências, ferramentas, localidades e modelo de trabalho.'],
                ['02', 'comunidades', 'Entre nas conversas que ajudam no seu trabalho', 'Discussões, referências e encontros sobre problemas de operação, tecnologia, contratos e gestão jurídica.'],
                ['03', 'vagas', 'Compare oportunidades com o seu perfil', 'Os alertas mostram aderência e ajudam a identificar pontos do histórico que merecem exemplos melhores.'],
              ].map(([number, label, title, description]) => (
                <div key={label} className="rounded-[22px] border border-white/10 bg-white/[0.035] p-5">
                  <span className="text-[10px] font-bold tracking-[0.12em] text-[#E88A6A]">{number} {label.toUpperCase()}</span>
                  <h3 className="mt-4 text-base font-semibold tracking-[-0.025em]" style={roundedFont}>{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/60">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[#CEC8BD] px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto grid max-w-[980px] gap-10 md:grid-cols-[0.72fr_1.28fr]">
            <div>
              <p className="text-[11px] font-bold tracking-[0.14em] text-[#C9684F]">ASSUNTOS</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em]" style={roundedFont}>Comunidades organizadas em torno do trabalho jurídico real.</h2>
              <p className="mt-5 text-sm leading-7 text-[#69635E]">A estrutura começa com dez frentes e evolui conforme os problemas, ferramentas e práticas discutidos pelos membros.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {topicKeys.map((key, index) => (
                <Link
                  key={key}
                  href={`/community?space=${key}`}
                  className="group flex items-center gap-3 rounded-2xl border border-[#CEC8BD] bg-[#FAF7F1] px-4 py-4 text-sm font-semibold text-[#111111] transition hover:-translate-y-0.5 hover:bg-white"
                >
                  <span className="text-[10px] font-bold text-[#C9684F]">{String(index + 1).padStart(2, '0')}</span>
                  <span className="flex-1">{COMMUNITY_CATEGORIES[key].title}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#918A83] transition group-hover:translate-x-0.5 group-hover:text-[#C9684F]" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-[980px] overflow-hidden rounded-[30px] border border-[#CEC8BD] bg-white shadow-[0_20px_60px_rgba(17,17,17,0.05)]">
            <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
              <div className="bg-[#F5F1E8] p-7 sm:p-9">
                <p className="text-[11px] font-bold tracking-[0.14em] text-[#C9684F]">ACESSO FUNDADOR</p>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.055em]" style={roundedFont}>{formatBRL(firstTier.annualPrice)}<span className="text-lg text-[#77716A]"> / ano</span></h2>
                <p className="mt-5 text-sm leading-7 text-[#69635E]">
                  O primeiro lote tem {firstTier.memberTo} vagas. Esse preço também vale nas renovações de quem entrou nesse lote.
                </p>
                <Link href={checkoutHref} className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#E88A6A] px-5 py-3 text-sm font-bold text-[#111111] transition hover:-translate-y-0.5 hover:bg-[#DE7B5C]">
                  Entrar no primeiro lote <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="p-7 sm:p-9">
                <div className="flex items-end justify-between border-b border-[#E6DED0] pb-4">
                  <h3 className="text-lg font-bold tracking-[-0.025em]" style={roundedFont}>Tabela de lançamento</h3>
                  <span className="text-xs text-[#918A83]">Preço anual</span>
                </div>
                <div>
                  {CLUB_LAUNCH_TIERS.map((tier, index) => (
                    <div key={tier.id} className={`grid grid-cols-[1.5rem_1fr_auto] items-center gap-4 py-5 ${index > 0 ? 'border-t border-[#E6DED0]' : ''}`}>
                      <Check className="h-4 w-4 text-[#E88A6A]" />
                      <div>
                        <p className="text-sm font-bold">Membros {tier.memberFrom} a {tier.memberTo}</p>
                        <p className="mt-1 text-xs text-[#918A83]">{tier.name}</p>
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

      <footer className="border-t border-[#CEC8BD] bg-[#FAF7F1] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-[980px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <BrandWordmark className="inline-flex items-baseline text-[23px] font-medium leading-none tracking-[-0.065em] text-[#111111]" />
          <p className="max-w-[620px] text-xs leading-5 text-[#77716A] sm:text-right">
            Comunidade independente, sem afiliação com a CLOC. O{' '}
            <a href="https://cloc.org/cloc-core-12/" target="_blank" rel="noreferrer" className="underline underline-offset-3 hover:text-[#111111]">Core 12</a>{' '}
            é uma referência para a organização dos temas.
          </p>
        </div>
      </footer>
    </div>
  )
}
