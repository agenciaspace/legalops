import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BellRing, BriefcaseBusiness, Building2, ExternalLink, UserRound } from 'lucide-react'
import { ClubHeader } from '@/components/ClubHeader'

export const metadata: Metadata = {
  title: 'Sobre | LegalOps Work',
  description: 'Como o LegalOps Work reúne vagas, organiza os dados e se conecta ao perfil do LegalOps Club.',
}

const steps = [
  {
    number: '01',
    title: 'O crawler encontra',
    description: 'A varredura consulta os boards suportados e páginas de empresas. Cada resultado mantém o link para a publicação original.',
  },
  {
    number: '02',
    title: 'O Work organiza',
    description: 'Cargo, empresa, modelo de trabalho e remuneração aparecem quando essas informações estão disponíveis na fonte.',
  },
  {
    number: '03',
    title: 'Você confere na origem',
    description: 'A página da empresa continua sendo a referência para requisitos, validade da vaga e candidatura.',
  },
]

export default function ManifestoPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#20201D]">
      <ClubHeader active="about" product="work" />

      <main>
        <section className="border-b border-[#E1E1DD] bg-white px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-[820px]">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-[#E45220]">SOBRE O LEGALOPS WORK</p>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-[-0.04em] sm:text-6xl">
              Vagas de Legal Ops reunidas em uma busca
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-[#62625D]">
              O Work reúne oportunidades encontradas em diferentes fontes e organiza os dados essenciais para comparação. Membros do Club podem usar o próprio perfil para receber alertas e preparar o currículo para cada vaga.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/" className="inline-flex items-center gap-2 rounded-md bg-[#20201D] px-5 py-3 text-sm font-semibold text-white hover:bg-[#373733]">
                Ver vagas <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/for-employers" className="inline-flex items-center rounded-md border border-[#D5D5D0] bg-white px-5 py-3 text-sm font-semibold hover:bg-[#F5F5F2]">
                Área para empresas
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-[#E1E1DD] px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-[980px]">
            <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
              <div>
                <p className="text-sm font-semibold text-[#E45220]">De onde vêm as vagas</p>
                <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em]">Da descoberta ao link original</h2>
              </div>
              <div className="divide-y divide-[#DEDEDA] border-y border-[#DEDEDA]">
                {steps.map(step => (
                  <div key={step.number} className="grid gap-2 py-5 sm:grid-cols-[2rem_10rem_1fr] sm:gap-5">
                    <span className="text-xs text-[#E45220]">{step.number}</span>
                    <h3 className="text-sm font-semibold">{step.title}</h3>
                    <p className="text-sm leading-6 text-[#686863]">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#E1E1DD] bg-[#20201D] px-5 py-16 text-white sm:px-8 sm:py-20">
          <div className="mx-auto max-w-[980px]">
            <p className="text-sm font-semibold text-[#FF8B5D]">Work + Club</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-[-0.03em]">O perfil controla as recomendações</h2>
            <div className="mt-10 grid border-y border-white/20 md:grid-cols-3">
              <div className="border-b border-white/20 py-6 md:border-b-0 md:border-r md:pr-6">
                <UserRound className="h-5 w-5 text-[#FF8B5D]" />
                <h3 className="mt-4 text-sm font-semibold">Perfil</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">O membro informa cargos procurados, competências, ferramentas e modelo de trabalho.</p>
              </div>
              <div className="border-b border-white/20 py-6 md:border-b-0 md:border-r md:px-6">
                <BriefcaseBusiness className="h-5 w-5 text-[#FF8B5D]" />
                <h3 className="mt-4 text-sm font-semibold">Comparação</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">Cada alerta explica quais campos do perfil têm relação com a descrição encontrada.</p>
              </div>
              <div className="py-6 md:pl-6">
                <BellRing className="h-5 w-5 text-[#FF8B5D]" />
                <h3 className="mt-4 text-sm font-semibold">Alertas e CV</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">Membros ativos que habilitaram os alertas recebem vagas no Club e sugestões de pontos para detalhar no currículo.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#E1E1DD] bg-white px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto grid max-w-[980px] gap-10 lg:grid-cols-2">
            <div className="border-t border-[#20201D] pt-5">
              <Building2 className="h-5 w-5 text-[#E45220]" />
              <h2 className="mt-5 text-2xl font-bold tracking-[-0.03em]">Para empresas</h2>
              <p className="mt-3 text-sm leading-7 text-[#686863]">
                Escritórios e departamentos jurídicos podem enviar uma vaga para revisão ou consultar os perfis que autorizaram exibição no diretório.
              </p>
              <Link href="/for-employers" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#E45220] hover:underline">
                Abrir área para empresas <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="border-t border-[#20201D] pt-5">
              <ExternalLink className="h-5 w-5 text-[#E45220]" />
              <h2 className="mt-5 text-2xl font-bold tracking-[-0.03em]">Limites dos dados</h2>
              <p className="mt-3 text-sm leading-7 text-[#686863]">
                Uma vaga pode ser alterada ou encerrada pela empresa sem aviso. Quando localidade ou remuneração não estão claras na fonte, o Work mostra essa ausência em vez de completar o dado por conta própria.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E1E1DD] bg-white px-5 py-7 sm:px-8">
        <div className="mx-auto flex max-w-[980px] flex-col gap-3 text-xs text-[#777772] sm:flex-row sm:items-center sm:justify-between">
          <span>LegalOps Work</span>
          <Link href="https://legalops.club/club/about" className="hover:text-[#20201D]">Como funciona o LegalOps Club</Link>
        </div>
      </footer>
    </div>
  )
}
