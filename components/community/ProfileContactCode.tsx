import Link from 'next/link'
import { ShareContact } from './ContactControls'

export function ProfileContactCode({ userId, own = false }: { userId: string; own?: boolean }) {
  return <section id="contato" className="rounded-xl border border-[#CEC8BD] bg-white p-4">
    <h2 className="text-sm font-semibold">QR de contato</h2>
    <p className="mt-2 text-xs leading-5 text-[#69635E]">{own ? 'Seu cartão pessoal para trocar contatos com a comunidade.' : 'Escaneie para abrir o cartão e salvar este contato.'}</p>
    <img src={`/contact/${userId}/qr`} alt="QR do perfil para trocar contatos" width={192} height={192} loading="lazy" className="mx-auto my-3 aspect-square w-full max-w-48" />
    <ShareContact id={userId} />
    {own && <Link href="/community/contact" className="mt-3 inline-flex min-h-11 items-center text-xs font-semibold underline">Configurar meus dados de contato</Link>}
  </section>
}
