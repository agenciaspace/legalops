import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ClubHeader } from '@/components/ClubHeader'
import { CLUB_LAUNCH_TIERS, formatBRL } from '@/lib/club-pricing'
import { COMMUNITY_CATEGORIES } from '@/lib/community'

export const metadata: Metadata = {
  title: 'Sobre | LegalOps Club',
  description: 'Como funcionam as comunidades, os encontros, os resumos e o acesso ao LegalOps Club.',
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
    <div className="min-h-screen bg-[#F7F7F5] text-[#20201D]">
      <ClubHeader active="about" />

      <main>
        <section className="border-b border-[#E1E1DD] bg-white px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-[820px]">
            <p className="text-sm font-semibold text-[#E45220]">Sobre o LegalOps Club</p>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-[-0.04em] sm:text-6xl">
              Uma comunidade para profissionais de operações jurídicas
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-[#62625D]">
              O Club reúne grupos sobre processos, tecnologia, dados, contratos, fornecedores, estratégia e carreira. Cada grupo tem discussões próprias e acesso pelo mesmo perfil de membro.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/club" className="inline-flex items-center gap-2 rounded-md bg-[#20201D] px-5 py-3 text-sm font-semibold text-white hover:bg-[#373733]">
                Ver comunidades <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={checkoutHref} className="inline-flex items-center rounded-md border border-[#D5D5D0] bg-white px-5 py-3 text-sm font-semibold hover:bg-[#F5F5F2]">
                Participar do primeiro lote
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-[#E1E1DD] px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto grid max-w-[980px] gap-12 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-sm font-semibold text-[#E45220]">Como funciona</p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em]">Da publicação ao resumo</h2>
              <p className="mt-5 text-sm leading-7 text-[#686863]">
                Um membro escolhe o grupo, descreve a situação e publica a dúvida. Outros membros respondem no mesmo tópico. Assuntos que precisam de mais tempo podem virar um encontro ao vivo.
              </p>
            </div>

            <div className="divide-y divide-[#DEDEDA] border-y border-[#DEDEDA]">
              {membershipIncludes.map((item, index) => (
                <div key={item.title} className="grid gap-2 py-5 sm:grid-cols-[2rem_11rem_1fr] sm:gap-5">
                  <span className="text-xs text-[#E45220]">{String(index + 1).padStart(2, '0')}</span>
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <p className="text-sm leading-6 text-[#686863]">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[#E1E1DD] bg-white px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-[980px]">
            <div className="grid gap-8 md:grid-cols-[0.75fr_1.25fr]">
              <div>
                <p className="text-sm font-semibold text-[#E45220]">Assuntos</p>
                <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em]">Dez grupos no lançamento</h2>
                <p className="mt-5 text-sm leading-7 text-[#686863]">A lista pode mudar conforme o uso da comunidade.</p>
              </div>
              <div className="grid border-t border-[#DEDEDA] sm:grid-cols-2">
                {topicKeys.map((key, index) => (
                  <Link
                    key={key}
                    href={`/community?space=${key}`}
                    className={`flex items-center gap-3 border-b border-[#DEDEDA] py-4 text-sm hover:text-[#E45220] sm:px-4 ${index % 2 === 0 ? 'sm:border-r sm:pl-0' : 'sm:pr-0'}`}
                  >
                    <span className="text-[10px] text-[#A1A19C]">{String(index + 1).padStart(2, '0')}</span>
                    {COMMUNITY_CATEGORIES[key].title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto grid max-w-[980px] gap-12 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-sm font-semibold text-[#E45220]">Acesso fundador</p>
              <h2 className="mt-3 text-4xl font-bold tracking-[-0.04em]">{formatBRL(firstTier.annualPrice)} por ano</h2>
              <p className="mt-5 text-sm leading-7 text-[#686863]">
                O primeiro lote tem {firstTier.memberTo} vagas. Esse preço também vale nas renovações de quem entrou nesse lote.
              </p>
              <Link href={checkoutHref} className="mt-7 inline-flex items-center gap-2 rounded-md bg-[#E45220] px-5 py-3 text-sm font-semibold text-white hover:bg-[#C94317]">
                Entrar no primeiro lote <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div>
              <div className="flex items-end justify-between border-b border-[#CECEC9] pb-4">
                <h3 className="text-lg font-semibold">Tabela de lançamento</h3>
                <span className="text-xs text-[#858580]">Preço anual</span>
              </div>
              <div className="divide-y divide-[#DEDEDA]">
                {CLUB_LAUNCH_TIERS.map((tier, index) => (
                  <div key={tier.id} className="grid grid-cols-[2rem_1fr_auto] items-center gap-4 py-5">
                    <span className="text-[10px] text-[#E45220]">{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <p className="text-sm font-semibold">Membros {tier.memberFrom} a {tier.memberTo}</p>
                      <p className="mt-1 text-xs text-[#8A8A85]">{tier.name}</p>
                    </div>
                    <p className="text-base font-semibold">{formatBRL(tier.annualPrice)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E1E1DD] bg-white px-5 py-7 sm:px-8">
        <div className="mx-auto flex max-w-[980px] flex-col gap-3 text-xs text-[#777772] sm:flex-row sm:items-center sm:justify-between">
          <span>LegalOps Club</span>
          <p>
            Comunidade independente, sem afiliação com a CLOC. O{' '}
            <a href="https://cloc.org/cloc-core-12/" target="_blank" rel="noreferrer" className="underline hover:text-[#20201D]">Core 12</a>{' '}
            é uma referência para a organização dos temas.
          </p>
        </div>
      </footer>
    </div>
  )
}
