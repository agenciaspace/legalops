import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { CommunityTabs } from '@/components/community/CommunityTabs'

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-65px)]">
      <header className="bg-[#1A1A1A] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-[-0.03em]">LegalOps Club</h1>
              <span className="rounded-full bg-[#FF6A00] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">Fundador</span>
            </div>
            <p className="mt-1 text-xs text-white/50">Aprenda, aplique e compartilhe.</p>
          </div>
          <Link href="/club" className="hidden items-center gap-1 text-xs font-bold text-white/50 transition hover:text-white sm:flex">
            Página do Club <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <CommunityTabs />
      </header>
      {children}
    </div>
  )
}
