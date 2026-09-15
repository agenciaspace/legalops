import type { Metadata } from 'next'
import { ArrowUpRight, MessageCircle } from 'lucide-react'
import { BrandWordmark } from '@/components/BrandLogo'
import { createAdminClient } from '@/lib/supabase-admin'

export const metadata: Metadata = {
  title: 'legalops.club | comunidade para profissionais do jurídico',
  description: 'Uma comunidade para trocar experiências sobre o trabalho no jurídico. Vamos ter app, agente pessoal, assuntos para acompanhar e encontros com líderes da sua região.',
  openGraph: {
    title: 'legalops.club | vamos falar de trabalho no jurídico',
    description: 'Converse com outros profissionais do jurídico. Conheça o que estamos preparando para a comunidade: agente pessoal, app e encontros por região.',
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
    description: 'Cada membro terá um agente de IA. Você poderá pedir um resumo do que perdeu, procurar uma referência que alguém compartilhou ou tirar uma dúvida sobre as conversas. Ele vai acompanhar os assuntos que você escolher.',
  },
  {
    title: 'líderes na sua região',
    description: 'Vamos definir lideranças por região para organizar encontros e aproximar quem trabalha por perto. Você poderá ver quem é responsável pela sua região e acompanhar a programação local.',
  },
  {
    title: 'acesso pelo app',
    description: 'O club também terá um app. Você poderá abrir suas conversas, consultar o agente e ver as novidades dos assuntos que acompanha pelo celular.',
  },
  {
    title: 'assuntos que você quer seguir',
    description: 'Contratos, IA, gestão jurídica, carreira: você escolhe o que quer acompanhar. As conversas e os materiais vão ficar organizados por assunto para você conseguir encontrá-los depois.',
  },
]

function GroupInvitation({ url }: { url: string | null }) {
  const style = 'inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-xl px-6 py-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#187645] sm:w-auto'
  return (
    <div>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className={style + ' bg-[#187645] text-white hover:bg-[#125C35]'}>
          <MessageCircle aria-hidden="true" className="h-5 w-5" /> Entrar no WhatsApp <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
        </a>
      ) : (
        <button disabled className={style + ' cursor-not-allowed bg-[#DCD9CF] text-[#615F57]'}>
          <MessageCircle aria-hidden="true" className="h-5 w-5" /> Estamos preparando o WhatsApp
        </button>
      )}
      <p className="mt-3 max-w-md text-xs leading-5 text-[#716B65]">
        {url ? 'O link abre o convite no WhatsApp.' : 'Vamos colocar o convite aqui assim que estiver pronto.'}
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
              troque ideia com quem também trabalha no jurídico<span className="text-[#E88A6A]">.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#625E59] sm:text-lg sm:leading-8">
              Aqui você vai poder perguntar como outros profissionais estão resolvendo um problema parecido com o seu. Ou compartilhar algo que funcionou no seu time.
            </p>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[#625E59]">A comunidade começa no WhatsApp. Estamos preparando também um app, com um agente para cada membro e acompanhamento dos assuntos que você escolher.</p>
            <div className="mt-8"><GroupInvitation url={inviteUrl} /></div>
            <a href="#funcionalidades" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold underline decoration-[#C9684F] underline-offset-4">Veja o que estamos preparando ↓</a>
          </div>
          <aside className="rounded-lg border border-[#CEC8BD] bg-[#EDE5D8] p-7 sm:p-9" aria-label="Exemplo ilustrativo das funcionalidades previstas">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#716B65]">Um exemplo do que vem por aí</p>
            <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-[-.04em]" style={headingFont}>o que eu perdi essa semana?</h2>
            <p className="mt-4 text-sm leading-6 text-[#625E59]">Essa é uma das perguntas que você poderá fazer ao seu agente. Ele vai reunir o que aconteceu nos assuntos que você acompanha e indicar onde continuar a leitura.</p>
            <div className="mt-7 space-y-5 border-t border-[#C9C0B1] pt-6">
              {[
                ['Sobre contratos, por exemplo', 'Você poderá pedir as referências de uma discussão sobre IA que não conseguiu acompanhar.'],
                ['E os encontros?', 'Você também poderá acompanhar os convites organizados pela liderança da sua região.'],
              ].map(([title, description]) => (
                <div key={title}><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-[#625E59]">{description}</p></div>
              ))}
            </div>
          </aside>
        </section>
        <nav aria-label="Ecossistema legalops" className="mx-auto grid max-w-[1180px] gap-6 px-5 pb-12 sm:grid-cols-3 sm:px-8">
          {[
            ['legalops.club', 'comunidade', 'Trocas entre profissionais do jurídico.', 'https://legalops.club'],
            ['legalops.work', 'vagas', 'Vagas e acompanhamento de candidaturas.', 'https://legalops.work'],
            ['legalops.dev', 'open source', 'Projetos abertos de tecnologia jurídica.', 'https://legalops.dev'],
          ].map(([name, label, description, href]) => (
            <a key={name} href={href} aria-current={name === 'legalops.club' ? 'page' : undefined} className={`border-t-2 pt-4 ${name === 'legalops.club' ? 'border-[#C9684F]' : 'border-[#CEC8BD]'}`}>
              <span className="text-sm font-semibold">{name} / {label}</span>
              <p className="mt-2 text-xs leading-5 text-[#625E59]">{description}</p>
            </a>
          ))}
        </nav>
        <section className="border-y border-[#CEC8BD] bg-[#FAF7F1]">
          <div className="mx-auto grid max-w-[1180px] gap-6 px-5 py-10 sm:px-8 sm:py-12 md:grid-cols-[.6fr_1.4fr] md:items-center">
            <h2 className="text-2xl font-semibold tracking-[-.035em]" style={headingFont}>quem pode participar?</h2>
            <p className="text-sm leading-7 text-[#625E59] sm:text-base">Quem trabalha em departamento jurídico, escritório, Legal Ops ou Legal Tech e tem vontade de trocar experiências com outros profissionais. Os assuntos vão de contratos e gestão até tecnologia e carreira.</p>
          </div>
        </section>
        <section id="funcionalidades" className="mx-auto max-w-[1180px] scroll-mt-8 px-5 py-14 sm:px-8 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[.15em] text-[#A24D36]">O que estamos preparando</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-.045em] sm:text-5xl" style={headingFont}>como o club vai funcionar<span className="text-[#E88A6A]">.</span></h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-[#625E59] sm:text-base">Esses recursos ainda estão em preparação. Vamos avisar no WhatsApp quando cada um estiver disponível.</p>
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
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#CEC8BD]">A ideia é que você não perca uma informação importante só porque passou uns dias sem abrir o grupo. Seu agente vai resumir as novidades dos assuntos que você segue, com o caminho para voltar à conversa e consultar os materiais.</p>
          </div>
        </section>
        <section className="mx-auto max-w-[1180px] px-5 py-14 sm:px-8 sm:py-20">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-[-.045em] sm:text-5xl" style={headingFont}>venha pro club<span className="text-[#E88A6A]">.</span></h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#625E59]">É pelo WhatsApp que vamos começar a reunir o pessoal e combinar os primeiros encontros. Por lá também vamos contar quando o app e os outros recursos estiverem prontos.</p>
          <div className="mt-7"><GroupInvitation url={inviteUrl} /></div>
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
