'use client'

import { usePathname } from 'next/navigation'

export function AppMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isCommunity = pathname.startsWith('/community')

  return (
    <main className={isCommunity ? 'w-full' : 'mx-auto w-full max-w-7xl'}>
      {children}
    </main>
  )
}
