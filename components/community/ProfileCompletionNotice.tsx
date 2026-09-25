import Link from 'next/link'
import { getClubTranslator } from '@/lib/club-locale-server'

export function ProfileCompletionNotice({ visible }: { visible: boolean }) {
  if (!visible) return null

  const t = getClubTranslator()
  return (
    <aside role="status" className="mx-4 mt-4 flex flex-col gap-3 rounded-xl border border-[#D4A36F] bg-[#FFF8EA] px-4 py-4 text-[#4B3525] sm:mx-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-bold">{t('Complete seu perfil')}</p>
        <p className="mt-1 text-xs leading-5 text-[#6F5745]">
          {t('Adicione uma foto e complete seus dados profissionais para receber o selo de perfil completo.')}
        </p>
      </div>
      <Link href="/community/profile#verification" className="inline-flex min-h-11 shrink-0 items-center font-bold text-[#8B3F2D] underline underline-offset-4">
        {t('Completar agora')} →
      </Link>
    </aside>
  )
}
