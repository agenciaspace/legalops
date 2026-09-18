'use client'
import { useClubLanguage } from '@/components/community/ClubLanguage'
import { Share2 } from 'lucide-react'

export function EventShare({ slug, title }: { slug: string; title: string }) {
 const { t, locale } = useClubLanguage()

  const url = `https://legalops.club/community/events/${encodeURIComponent(slug)}`
  const text = [
    `*${title}*`,
    locale === 'en'
      ? t("📸 Share photos, exchange documents and keep the conversation going after our meeting.")
      : locale === 'es' ? t("📸 Comparte fotos, intercambia documentos y continúa las conversaciones de nuestro encuentro.") : t("📸 Compartilhe fotos, troque documentos e continue as conversas do nosso encontro."),
    `${locale === 'en' ? t("👉 Open the event space:") : locale === 'es' ? t("👉 Accede al espacio del evento:") : t("👉 Acesse o espaço do evento:")}\n${url}`,
    locale === 'en'
      ? t("Sign in to access the materials. New to the community? Registration is free.")
      : locale === 'es' ? t("Inicia sesión para acceder a los materiales. ¿Aún no formas parte de la comunidad? El registro es gratuito.") : t("Para acessar os materiais, entre na sua conta. Ainda não faz parte da comunidade? O cadastro é gratuito."),
  ].join('\n\n')
  return <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#CEC8BD] bg-white px-3 py-2 text-xs font-semibold text-[#24231F] hover:bg-[#F5F1E8]">
    <Share2 aria-hidden="true" className="h-4 w-4 shrink-0" />{t("Compartilhar no WhatsApp")} </a>
}
