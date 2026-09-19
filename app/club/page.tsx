import type { Metadata } from 'next'
import Link from 'next/link'
import { BrandWordmark } from '@/components/BrandLogo'
import { LegalOpsEcosystem } from '@/components/LegalOpsEcosystem'
import { ResumeClubSession } from '@/components/community/ResumeClubSession'


export const metadata: Metadata = {
  title: 'legalops.club | comunidade para profissionais do jurídico',
  description: 'Comunidade gratuita para perfis ligados ao jurídico, com LinkedIn e apresentação profissional. O Pro reúne agente pessoal, vagas e recursos práticos.',
  openGraph: {
    title: 'legalops.club | vamos falar de trabalho no jurídico',
    description: 'Cadastre-se na comunidade com seu perfil profissional. Conheça também o Pro e seu agente pessoal.',
    url: 'https://legalops.club',
    siteName: 'legalops.club',
    type: 'website',
  },
}
export const dynamic = 'force-dynamic'
const headingFont = { fontFamily: 'var(--font-quicksand), ui-rounded, sans-serif' }
const plannedFeatures = [
  {
    title: 'seu agente',
    description: 'Seu agente guarda o histórico das suas conversas e o contexto que você escolher compartilhar. Peça um resumo das discussões recentes do site, procure uma referência ou organize os próximos passos do seu trabalho.',
  },
  {
    title: 'conexão com o Work',
    description: 'Consulte vagas verificadas do Work na mesma conversa. O agente usa seu perfil para contextualizar as oportunidades e explicar o que merece atenção.',
  },
  {
    title: 'recursos para contratos',
    description: 'Leve uma dúvida sobre contratos para a conversa e encontre guias, ferramentas e referências do OpenCLM para apoiar seus próximos passos.',
  },
  {
    title: 'assuntos que você quer seguir',
    description: 'Escolha os assuntos e descreva seu foco atual. Essas preferências ficam salvas e ajudam o agente a priorizar as referências consultadas em cada resposta.',
  },
]

function SignupLink() {
  return <Link href="/cadastro" className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#111111] px-6 py-3 text-sm font-semibold text-white hover:bg-[#2A2927] sm:w-auto">Criar meu perfil gratuito →</Link>
}

export default function ClubLandingPage() {
  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#111111]" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
      <ResumeClubSession />
      <header className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 border-b border-[#CEC8BD] px-5 py-6 sm:px-8">
        <BrandWordmark suffix="club" className="inline-flex items-baseline text-[25px] leading-none sm:text-[30px]" />
        <Link href="/login?next=/community" className="text-sm font-semibold underline underline-offset-4">Entrar</Link>
      </header>
      <main>
        <section className="mx-auto grid max-w-[1180px] gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.2fr_.8fr] lg:items-center lg:gap-16 lg:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.15em] text-[#A24D36]">legalops.club / comunidade</p>
            <h1 className="mt-5 text-[44px] font-semibold leading-[1.03] tracking-[-.055em] sm:text-[64px] lg:text-[76px]" style={headingFont}>
              troque ideia com quem também trabalha no jurídico<span className="text-[#E88A6A]">.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#625E59] sm:text-lg sm:leading-8">
              Aqui você vai poder perguntar como outros profissionais estão resolvendo um problema parecido com o seu. Ou compartilhar algo que funcionou no seu time.
            </p>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[#625E59]">A participação na comunidade é gratuita para perfis ligados ao jurídico. Cadastre seu LinkedIn, conte com o que você trabalha e escolha os assuntos que quer acompanhar.</p>
            <div className="mt-8"><SignupLink /></div>
            <a href="#pro" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold underline decoration-[#C9684F] underline-offset-4">Conheça a proposta do Pro ↓</a>
          </div>
          <aside className="rounded-lg border border-[#CEC8BD] bg-[#EDE5D8] p-7 sm:p-9" aria-label="Exemplo ilustrativo das funcionalidades previstas">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#716B65]">Pro · agente pessoal</p>
            <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-[-.04em]" style={headingFont}>o que eu perdi essa semana?</h2>
            <p className="mt-4 text-sm leading-6 text-[#625E59]">Peça ao seu agente para consultar as discussões recentes do site. A resposta traz referências para você conferir o contexto e continuar a leitura.</p>
            <div className="mt-7 space-y-5 border-t border-[#C9C0B1] pt-6">
              {[
                ['Sobre contratos, por exemplo', 'Peça referências das discussões e compare com os recursos do OpenCLM.'],
                ['E os encontros?', 'Os encontros estão no calendário da comunidade. A organização por lideranças regionais continua em preparação.'],
              ].map(([title, description]) => (
                <div key={title}><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-[#625E59]">{description}</p></div>
              ))}
            </div>
          </aside>
        </section>
        <LegalOpsEcosystem active="club" descriptions={{
          club: 'Trocas entre profissionais do jurídico.',
          work: 'Vagas e acompanhamento de candidaturas.',
          dev: 'Guias e ferramentas para o trabalho jurídico.',
        }} />
        <section id="como-funciona" className="border-y border-[#CEC8BD] bg-[#FAF7F1]">
          <div className="mx-auto grid max-w-[1180px] gap-6 px-5 py-10 sm:px-8 sm:py-12 md:grid-cols-[.6fr_1.4fr] md:items-center">
            <h2 className="text-2xl font-semibold tracking-[-.035em]" style={headingFont}>quem pode participar?</h2>
            <p className="text-sm leading-7 text-[#625E59] sm:text-base">Quem trabalha, estuda ou desenvolve soluções para o jurídico: departamentos, escritórios, Legal Ops, Legal Tech, consultoria e pesquisa. O cadastro pede LinkedIn pessoal, atuação, organização ou contexto profissional, cidade, apresentação e interesses.</p>
          </div>
        </section>
        <section aria-label="Comunidade e Pro" className="mx-auto max-w-[1180px] px-5 pt-14 sm:px-8">
          <div className="grid border-y border-[#CEC8BD] md:grid-cols-2">
            <div className="py-8 md:pr-10"><p className="text-xs font-semibold uppercase tracking-widest text-[#A24D36]">Comunidade · gratuita</p><h2 className="mt-3 text-2xl font-semibold" style={headingFont}>pessoas e conversas</h2><p className="mt-4 text-sm leading-7 text-[#625E59]">Perfil profissional, troca de experiências, encontros e contato com outros membros. A entrada depende do seu perfil e das regras da comunidade.</p></div>
            <div className="border-t border-[#CEC8BD] py-8 md:border-l md:border-t-0 md:pl-10"><p className="text-xs font-semibold uppercase tracking-widest text-[#A24D36]">Club Pro</p><h2 className="mt-3 text-2xl font-semibold" style={headingFont}>agente e referências</h2><p className="mt-4 text-sm leading-7 text-[#625E59]">Agente privado com histórico e preferências, discussões do Club, vagas selecionadas e recursos para o trabalho jurídico.</p></div>
          </div>
        </section>
        <section id="pro" className="mx-auto max-w-[1180px] scroll-mt-8 px-5 py-14 sm:px-8 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[.15em] text-[#A24D36]">Club Pro · primeira versão</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-.045em] sm:text-5xl" style={headingFont}>um agente para acompanhar seu contexto<span className="text-[#E88A6A]">.</span></h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-[#625E59] sm:text-base">Converse com seu agente, salve o contexto e consulte discussões, vagas e materiais de apoio em uma só conversa. A primeira versão inclui até 30 perguntas por dia. A leitura automática do WhatsApp e o aplicativo próprio ainda estão em preparação.</p>
          <Link href="/club/checkout" className="mt-6 inline-flex min-h-12 items-center rounded-lg bg-[#111] px-6 py-3 text-sm font-semibold text-white">Ver plano Pro e pagamento por PIX →</Link>
          <div className="mt-10 border-t border-[#CEC8BD]">
            {plannedFeatures.map((feature, index) => (
              <article key={feature.title} className="grid gap-4 border-b border-[#CEC8BD] py-8 md:grid-cols-[.8fr_1.2fr] md:gap-12">
                <div className="flex items-baseline gap-4">
                  <span className="text-xs font-semibold text-[#A24D36]">0{index + 1}</span>
                  <h3 className="text-2xl font-semibold tracking-[-.035em]" style={headingFont}>{feature.title}</h3>
                </div>
                <div><p className="text-sm leading-7 text-[#625E59] sm:text-base">{feature.description}</p></div>
              </article>
            ))}
          </div>
        </section>
        <section className="bg-[#111111] text-[#F5F1E8]">
          <div className="mx-auto max-w-[1180px] px-5 py-14 sm:px-8 sm:py-20">
            <h2 className="max-w-3xl text-3xl font-semibold tracking-[-.045em] sm:text-5xl" style={headingFont}>pra quando você ficar uns dias fora.</h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#CEC8BD]">Peça um resumo das discussões recentes do site e consulte os links usados na resposta. Seu histórico fica salvo para retomar a conversa quando precisar.</p>
          </div>
        </section>
        <section className="mx-auto max-w-[1180px] px-5 py-14 sm:px-8 sm:py-20">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-[-.045em] sm:text-5xl" style={headingFont}>venha pro club<span className="text-[#E88A6A]">.</span></h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#625E59]">Crie sua conta, confirme o email e complete o perfil. As conversas, os encontros e o diretório fazem parte da comunidade gratuita. O app e as lideranças regionais seguem em preparação; o agente pessoal faz parte do Pro.</p>
          <div className="mt-7"><SignupLink /></div>
        </section>
      </main>
      <footer className="border-t border-[#CEC8BD] px-5 py-6 sm:px-8">
        <div className="mx-auto flex max-w-[1116px] flex-col justify-between gap-3 text-xs text-[#716B65] sm:flex-row">
          <span>legalops.club · comunidade em formação</span><span>Para quem trabalha no jurídico.</span>
        </div>
      </footer>
    </div>
  )
}
