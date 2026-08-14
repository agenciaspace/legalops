import Link from 'next/link'
import { BrandMark } from '@/components/BrandLogo'

export function ClubHeader({ active }: { active?: 'communities' | 'about' }) {
  return (
    <header className="border-b border-[#E4E4E0] bg-white">
      <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-5 sm:px-8">
        <Link href="/club" className="flex items-center gap-2.5" aria-label="LegalOps Club">
          <BrandMark className="h-8 w-8 text-[#20201D]" />
          <span className="text-[13px] font-bold tracking-[0.07em] text-[#20201D]">
            LEGALOPS <span className="text-[#E45220]">CLUB</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/club"
            className={`hidden rounded-md px-3 py-2 sm:inline-flex ${active === 'communities' ? 'bg-[#F0F0ED] font-semibold text-[#20201D]' : 'text-[#686863] hover:bg-[#F5F5F2] hover:text-[#20201D]'}`}
          >
            Comunidades
          </Link>
          <Link
            href="/club/about"
            className={`hidden rounded-md px-3 py-2 sm:inline-flex ${active === 'about' ? 'bg-[#F0F0ED] font-semibold text-[#20201D]' : 'text-[#686863] hover:bg-[#F5F5F2] hover:text-[#20201D]'}`}
          >
            Sobre
          </Link>
          <Link
            href="/login?next=/community"
            className="rounded-md border border-[#D8D8D4] bg-white px-4 py-2 text-xs font-semibold text-[#20201D] shadow-sm hover:bg-[#F7F7F5]"
          >
            Entrar
          </Link>
        </nav>
      </div>
    </header>
  )
}
