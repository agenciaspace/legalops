import type { Metadata } from 'next'
import { ArrowUpRight, MessageCircle } from 'lucide-react'
import { BrandWordmark } from '@/components/BrandLogo'
import { createAdminClient } from '@/lib/supabase-admin'

export const metadata: Metadata = {
  title: 'legalops.club — comunidade para profissionais do jurídico',
  description: 'O legalops.club está chegando. Acompanhe os encontros e o lançamento da comunidade pelo grupo de interessados no WhatsApp.',
  openGraph: {
    title: 'legalops.club — vamos conversar sobre o jurídico?',
    description: 'Uma comunidade em formação. Acompanhe o lançamento pelo grupo de interessados no WhatsApp.',
    url: 'https://legalops.club',
    siteName: 'legalops.club',
    type: 'website',
  },
}
export const dynamic = 'force-dynamic'
const headingFont = { fontFamily: 'var(--font-quicksand), ui-rounded, sans-serif' }

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
        <span className="rounded-full border border-[#CEC8BD] px-3 py-2 text-[10px] font-semibold uppercase tracking-[.12em] text-[#716B65]">Em lançamento</span>
      </header>
      <main>
        <section className="mx-auto grid max-w-[1180px] gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.2fr_.8fr] lg:items-center lg:gap-16 lg:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.15em] text-[#A24D36]">O jurídico tem muito para trocar.</p>
            <h1 className="mt-5 text-[44px] font-semibold leading-[1.03] tracking-[-.055em] sm:text-[64px] lg:text-[76px]" style={headingFont}>
              as boas conversas começam com as pessoas certas<span className="text-[#E88A6A]">.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#625E59] sm:text-lg sm:leading-8">
              O legalops.club está chegando para conectar quem vive o dia a dia do jurídico. Entre no grupo de interessados no WhatsApp e acompanhe o lançamento desde o começo.
            </p>
            <div className="mt-8"><GroupInvitation url={inviteUrl} /></div>
          </div>
          <aside className="rounded-[24px] border border-[#CEC8BD] bg-[#EDE5D8] p-7 sm:p-9" aria-label="Sobre o grupo de interessados">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F1E8] text-[#187645]"><MessageCircle aria-hidden="true" className="h-7 w-7" strokeWidth={1.5} /></div>
            <p className="mt-8 text-[10px] font-bold uppercase tracking-[.16em] text-[#716B65]">Nosso ponto de encontro</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-.04em]" style={headingFont}>primeiro, a gente se encontra no WhatsApp.</h2>
            <p className="mt-4 text-sm leading-6 text-[#625E59]">Um grupo para quem quer fazer parte da comunidade e acompanhar os próximos passos.</p>
            <div className="mt-7 space-y-4 border-t border-[#C9C0B1] pt-6">
              {['Novidades sobre o lançamento', 'Convites para encontros e benchs', 'Os próximos passos da comunidade'].map((item, index) => (
                <div key={item} className="flex items-start gap-4 text-sm"><span className="text-xs font-semibold text-[#A24D36]">0{index + 1}</span><span>{item}</span></div>
              ))}
            </div>
          </aside>
        </section>
        <section className="border-y border-[#CEC8BD] bg-[#FAF7F1]">
          <div className="mx-auto grid max-w-[1180px] gap-6 px-5 py-10 sm:px-8 sm:py-12 md:grid-cols-[.6fr_1.4fr] md:items-center">
            <h2 className="text-2xl font-semibold tracking-[-.035em]" style={headingFont}>para quem faz o jurídico acontecer.</h2>
            <p className="text-sm leading-7 text-[#625E59] sm:text-base">Profissionais de departamentos jurídicos, escritórios, Legal Ops e Legal Tech. Gente que quer trocar experiências sobre contratos, processos, dados, tecnologia e carreira.</p>
          </div>
        </section>
        <section className="mx-auto max-w-[1180px] px-5 py-14 sm:px-8 sm:py-20">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-[-.045em] sm:text-5xl" style={headingFont}>faça parte dessa conversa desde o início<span className="text-[#E88A6A]">.</span></h2>
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
