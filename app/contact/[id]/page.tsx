import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BrandWordmark } from '@/components/BrandLogo'
import { SaveContactButton } from '@/components/community/ContactControls'
import { readContactCard } from '@/lib/contact-card-server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Contato | legalops.club', robots: { index: false, follow: false } }
export default async function ContactPage({params}:{params:{id:string}}) {
  const result = await readContactCard(params.id)
  if (result.status === 404) notFound()
  const path = `/contact/${params.id}`
  const { card, viewerId, isMember } = result
  const db = await createServerSupabaseClient()
  const { data: saved } = isMember && viewerId !== params.id ? await db.from('community_saved_contacts').select('member_id').eq('user_id', viewerId!).eq('member_id', params.id).maybeSingle() : {data:null}
  return <main className="min-h-screen bg-[#F5F1E8] px-4 py-8"><div className="mx-auto max-w-md"><Link href="/club"><BrandWordmark suffix="club" className="text-2xl" /></Link>
    <article className="mt-6 rounded-xl border border-[#CEC8BD] bg-white p-5 sm:p-6">
      {card ? <><p className="text-xs font-semibold uppercase tracking-wide text-[#C9684F]">Contato da comunidade</p><h1 className="mt-3 break-words text-2xl font-bold">{card.display_name}</h1><p className="mt-2 text-sm text-[#69635E]">{[card.current_role,card.organization_name].filter(Boolean).join(' · ')}</p>
      <div className="mt-5 grid gap-2">{card.linkedin_url && <a className="min-h-11 break-all py-2 text-sm underline" href={card.linkedin_url} target="_blank" rel="noreferrer">LinkedIn ↗</a>}{card.email && <a className="min-h-11 break-all py-2 text-sm underline" href={`mailto:${card.email}`}>{card.email}</a>}{card.phone && <div className="flex flex-wrap gap-4"><a className="min-h-11 py-2 text-sm underline" href={`tel:${card.phone}`}>{card.phone}</a><a className="min-h-11 py-2 text-sm underline" href={`https://wa.me/${card.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer">WhatsApp ↗</a></div>}{card.website && <a className="min-h-11 break-all py-2 text-sm underline" href={card.website} target="_blank" rel="noreferrer">Site ↗</a>}</div>
      <a href={`${path}/vcard`} className="mt-4 flex min-h-11 items-center justify-center rounded-lg bg-[#24231F] px-4 text-sm font-semibold text-white">Salvar contato no celular</a>
      {isMember && viewerId !== params.id && <div className="mt-3"><SaveContactButton id={params.id} initialSaved={!!saved} /></div>}
      {isMember && <Link href={`/community/members/${params.id}`} className="mt-4 block text-center text-sm underline">Ver perfil na comunidade</Link>}
      </> : <><h1 className="text-xl font-bold">{result.status === 503 ? 'Contato temporariamente indisponível' : 'Vamos nos conectar?'}</h1><p className="mt-3 text-sm leading-6 text-[#69635E]">{result.status === 503 ? 'Tente abrir este cartão novamente em instantes.' : 'Este membro compartilha seus dados apenas dentro da comunidade. Entre ou crie seu perfil para acessar.'}</p></>}
      {!isMember && <div className="mt-6 border-t border-[#E6DED0] pt-5"><Link href={`/cadastro?next=${encodeURIComponent(path)}`} className="flex min-h-11 items-center justify-center rounded-lg border border-[#CEC8BD] px-3 text-sm font-semibold">Entrar para a comunidade</Link><Link href={`/login?next=${encodeURIComponent(`/club/entrar?next=${encodeURIComponent(path)}`)}`} className="mt-3 block text-center text-sm underline">Já sou membro · fazer login</Link></div>}
    </article>
  </div></main>
}
