import { Share2 } from 'lucide-react'

export function EventShare({ slug, title }: { slug: string; title: string }) {
  const url = `https://legalops.club/community/events/${encodeURIComponent(slug)}`
  const text = `${title}\nCompartilhe fotos, documentos e acompanhe as conversas do evento na legalops.club. Para acessar, faça parte da comunidade.\n${url}`
  return <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#CEC8BD] bg-white px-3 py-2 text-xs font-semibold text-[#24231F] hover:bg-[#F5F1E8]">
    <Share2 aria-hidden="true" className="h-4 w-4 shrink-0" />Compartilhar no WhatsApp
  </a>
}
