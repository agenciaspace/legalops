import type { Metadata } from 'next'
import { ArrowUpRight, MessageCircle } from 'lucide-react'
import { BrandWordmark } from '@/components/BrandLogo'
import { createAdminClient } from '@/lib/supabase-admin'

export const metadata: Metadata = {
  title: 'legalops.club — comunidade para profissionais do jurídico',
  description: 'Conheça o que vem no legalops.club: um agente por membro, líderes regionais, acesso pelo app e acompanhamento por assunto para manter você por dentro do que importa.',
  openGraph: {
    title: 'legalops.club — acompanhe o que importa para você',
    description: 'Uma comunidade com agente pessoal, líderes regionais, app e assuntos do seu interesse. Conheça as funcionalidades previstas e acompanhe o lançamento.',
    url: 'https://legalops.club',
    siteName: 'legalops.club',
    type: 'website',
  },
}
export const dynamic = 'force-dynamic'
const headingFont = { fontFamily: 'var(--font-quicksand), ui-rounded, sans-serif' }
const plannedFeatures = [
  {
    title: 'um agente para cada membro.',
    description: 'Você terá seu próprio agente para acompanhar seus interesses na comunidade, reunir novidades relevantes e ajudar a recuperar o contexto das conversas.',
    example: 'Pergunte: “O que mudou nas discussões sobre IA desde a minha última visita?”',
  },
  {
    title: 'líderes regionais, conexões por perto.',
    description: 'A comunidade terá líderes configurados por região para conectar membros, organizar encontros locais e aproximar as trocas da realidade de cada lugar.',
    example: 'Acompanhe sua região, saiba quem a lidera e descubra os próximos encontros.',
  },
  {
    title: 'a comunidade também no app.',
    description: 'O acesso pelo app está previsto para levar suas conversas, assuntos e atualizações com você. Um lugar para retomar o que estava acompanhando, onde estiver.',
    example: 'Abra o app e encontre as novidades dos temas e da região que você acompanha.',
  },
  {
    title: 'acompanhe por assunto.',
    description: 'Você poderá seguir temas como contratos, IA, gestão jurídica e carreira. As discussões e referências ficarão organizadas por interesse, com contexto para continuar a conversa.',
    example: 'Siga “contratos” e reencontre as referências compartilhadas sobre esse assunto.',
  },
]

function GroupInvitation({ url }: { url: string | null }) {
  const style = 'inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-xl px-6 py-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#187645] sm:w-auto'
  return (
    <div>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className={style + ' bg-[#187645] text-white hover:bg-[#125C35]'}>
          <MessageCircle aria-hidden="true" className="h-5 w-5" /> Entrar no grupo de interessados <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
        </a>
      ) : (
        <button disabled className={style + ' cursor-not-allowed bg-[#DCD9CF] text-[#615F57]'}>
          <MessageCircle aria-hidden="true" className="h-5 w-5" /> Grupo de WhatsApp em preparação
        </button>
      )}
      <p className="mt-3 max-w-md text-xs leading-5 text-[#716B65]">
        {url ? 'O convite abre no WhatsApp. Você decide se quer entrar.' : 'O link de entrada será disponibilizado aqui em breve.'}
      </p>
    </div>
  )
}

export default async function ClubLandingPage() {
  let inviteUrl: string | null = null
  try {
    const admin = createAdminClient()
    const { data } = await admin.from('club_launch_config').select('whatsapp_invite_url').eq('id', true).maybeSingle()
    if (typeof data?.whatsapp_invite_url === 'string' && /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+$/.test(data.whatsapp_invite_url)) {
      inviteUrl = data.whatsapp_invite_url
    }
  } catch {
    // Keep the landing available when the invitation cannot be loaded.
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#111111]" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
      <header className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 border-b border-[#CEC8BD] px-5 py-6 sm:px-8">
        <BrandWordmark suffix="club" className="inline-flex items-baseline text-[25px] leading-none sm:text-[30px]" />
        <span className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#716B65]">Em lançamento</span>
      </header>
      <main>
        <section className="mx-auto grid max-w-[1180px] gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.2fr_.8fr] lg:items-center lg:gap-16 lg:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.15em] text-[#A24D36]">legalops.club / comunidade</p>
            <h1 className="mt-5 text-[44px] font-semibold leading-[1.03] tracking-[-.055em] sm:text-[64px] lg:text-[76px]" style={headingFont}>
              o que importa no jurídico chega até você<span className="text-[#E88A6A]">.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#625E59] sm:text-lg sm:leading-8">
              Uma comunidade para trocar experiências e acompanhar o que importa para o seu trabalho. Teremos um agente por membro, líderes regionais, acesso pelo app e conversas organizadas por assunto.
            </p>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[#625E59]">Tudo pensado para você não perder informações importantes, mesmo quando não puder acompanhar cada conversa.</p>
            <div className="mt-8"><GroupInvitation url={inviteUrl} /></div>
            <a href="#funcionalidades" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold underline decoration-[#C9684F] underline-offset-4">Conheça o que vem no club ↓</a>
          </div>
          <aside className="rounded-lg border border-[#CEC8BD] bg-[#EDE5D8] p-7 sm:p-9" aria-label="Exemplo ilustrativo das funcionalidades previstas">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#716B65]">Exemplo ilustrativo · experiência prevista</p>
            <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-[-.04em]" style={headingFont}>você volta. o contexto vem junto.</h2>
            <p className="mt-4 text-sm leading-6 text-[#625E59]">Imagine abrir seu app depois de alguns dias e encontrar seu agente com as atualizações que têm a ver com você:</p>
            <div className="mt-7 space-y-5 border-t border-[#C9C0B1] pt-6">
              {[
                ['Seus assuntos', 'Uma discussão sobre IA em contratos, com as principais referências reunidas.'],
                ['Sua região', 'Um encontro organizado pela liderança local para trocar experiências.'],
                ['Seu próximo passo', 'Retome a conversa original ou peça mais contexto ao seu agente.'],
              ].map(([title, description]) => (
                <div key={title}><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-[#625E59]">{description}</p></div>
              ))}
            </div>
          </aside>
        </section>
        <nav aria-label="Ecossistema legalops" className="mx-auto grid max-w-[1180px] gap-6 px-5 pb-12 sm:grid-cols-3 sm:px-8">
          {[
            ['legalops.club', 'comunidade', 'Pessoas, conversas e conhecimento compartilhado.', 'https://legalops.club'],
            ['legalops.work', 'vagas', 'Oportunidades e próximos passos na carreira.', 'https://legalops.work'],
            ['legalops.dev', 'open source', 'Tecnologia jurídica para construir junto.', 'https://legalops.dev'],
          ].map(([name, label, description, href]) => (
            <a key={name} href={href} aria-current={name === 'legalops.club' ? 'page' : undefined} className={`border-t-2 pt-4 ${name === 'legalops.club' ? 'border-[#C9684F]' : 'border-[#CEC8BD]'}`}>
              <span className="text-sm font-semibold">{name} / {label}</span>
              <p className="mt-2 text-xs leading-5 text-[#625E59]">{description}</p>
            </a>
          ))}
        </nav>
        <section className="border-y border-[#CEC8BD] bg-[#FAF7F1]">
          <div className="mx-auto grid max-w-[1180px] gap-6 px-5 py-10 sm:px-8 sm:py-12 md:grid-cols-[.6fr_1.4fr] md:items-center">
            <h2 className="text-2xl font-semibold tracking-[-.035em]" style={headingFont}>para quem faz o jurídico acontecer.</h2>
            <p className="text-sm leading-7 text-[#625E59] sm:text-base">Profissionais de departamentos jurídicos, escritórios, Legal Ops e Legal Tech. Gente que quer trocar experiências sobre contratos, processos, dados, tecnologia e carreira.</p>
          </div>
        </section>
        <section id="funcionalidades" className="mx-auto max-w-[1180px] scroll-mt-8 px-5 py-14 sm:px-8 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[.15em] text-[#A24D36]">Funcionalidades previstas</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-.045em] sm:text-5xl" style={headingFont}>uma comunidade que acompanha você<span className="text-[#E88A6A]">.</span></h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-[#625E59] sm:text-base">Estas são as experiências que estamos preparando para o legalops.club. A disponibilidade de cada recurso será anunciada ao longo do lançamento.</p>
          <div className="mt-10 border-t border-[#CEC8BD]">
            {plannedFeatures.map((feature, index) => (
              <article key={feature.title} className="grid gap-4 border-b border-[#CEC8BD] py-8 md:grid-cols-[.8fr_1.2fr] md:gap-12">
                <div className="flex items-baseline gap-4">
                  <span className="text-xs font-semibold text-[#A24D36]">0{index + 1}</span>
                  <h3 className="text-2xl font-semibold tracking-[-.035em]" style={headingFont}>{feature.title}</h3>
                </div>
                <div><p className="text-sm leading-7 text-[#625E59] sm:text-base">{feature.description}</p><p className="mt-3 text-sm leading-6">{feature.example}</p></div>
              </article>
            ))}
          </div>
        </section>
        <section className="bg-[#111111] text-[#F5F1E8]">
          <div className="mx-auto max-w-[1180px] px-5 py-14 sm:px-8 sm:py-20">
            <p className="text-xs font-semibold uppercase tracking-[.15em] text-[#E88A6A]">Menos informação perdida. Mais contexto.</p>
            <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-.045em] sm:text-5xl" style={headingFont}>o importante continua ao seu alcance.</h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#CEC8BD]">A proposta é que você possa se afastar por alguns dias e voltar sabendo o que merece atenção. Seu agente, seus assuntos e sua região vão orientar esse acompanhamento.</p>
            <ol className="mt-10 grid gap-8 md:grid-cols-3">
              {[
                ['Você escolhe', 'Defina os assuntos e a região que fazem sentido para você.'],
                ['Seu agente acompanha', 'Receba um resumo das novidades relevantes para os seus interesses.'],
                ['Você retoma', 'Volte às conversas e referências com contexto, sem depender da memória ou de rolar todo o histórico.'],
              ].map(([title, description], index) => (
                <li key={title} className="border-t border-[#625E59] pt-5"><span className="text-xs text-[#E88A6A]">0{index + 1}</span><h3 className="mt-3 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#CEC8BD]">{description}</p></li>
              ))}
            </ol>
          </div>
        </section>
        <section className="mx-auto max-w-[1180px] px-5 py-14 sm:px-8 sm:py-20">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-[-.045em] sm:text-5xl" style={headingFont}>faça parte dessa conversa desde o início<span className="text-[#E88A6A]">.</span></h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#625E59]">O primeiro ponto de encontro será o grupo de interessados no WhatsApp. Por lá, você poderá acompanhar o lançamento, as novidades das funcionalidades e os convites para encontros e benchs.</p>
          <div className="mt-7"><GroupInvitation url={inviteUrl} /></div>
        </section>
      </main>
      <footer className="border-t border-[#CEC8BD] px-5 py-6 sm:px-8">
        <div className="mx-auto flex max-w-[1116px] flex-col justify-between gap-3 text-xs text-[#716B65] sm:flex-row">
          <span>legalops.club · comunidade em formação</span><span>O lançamento começa com uma conversa.</span>
        </div>
      </footer>
    </div>
  )
}
