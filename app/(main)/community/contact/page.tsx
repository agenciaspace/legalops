import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ContactSettings, ShareContact } from '@/components/community/ContactControls'
export const dynamic = 'force-dynamic'
export default async function MyContactPage() {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login?next=/community/contact')
  const { data: details } = await db.from('community_contact_cards').select('email,phone,website,public_enabled').eq('user_id', user.id).maybeSingle()
  return <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
    <Link href="/community/profile" className="text-sm text-[#69635E]">← Meu perfil</Link>
    <h1 className="mt-4 text-2xl font-bold text-[#24231F]">Meu QR code de contato</h1>
    <p className="mt-2 text-sm text-[#69635E]">Mostre no encontro para trocar contatos. O mesmo código acompanha você em todos os eventos.</p>
    <div className="mt-6 grid items-start gap-6 sm:grid-cols-2"><section className="rounded-xl border border-[#CEC8BD] bg-white p-4"><img src={`/contact/${user.id}/qr`} alt="Seu QR code de contato" width={256} height={256} className="mx-auto aspect-square w-full max-w-64" /><ShareContact id={user.id} /><p className="mt-4 text-center text-xs text-[#69635E]">{details?.public_enabled ? 'Cartão acessível a quem receber o link ou QR code.' : 'Atualmente, seus dados aparecem somente para membros. Visitantes podem se cadastrar pelo cartão.'}</p></section>
    <section className="rounded-xl border border-[#CEC8BD] bg-white p-4"><h2 className="mb-4 text-lg font-semibold">Dados compartilhados</h2><ContactSettings details={details ?? {email:null,phone:null,website:null,public_enabled:false}} /></section></div>
  </main>
}
