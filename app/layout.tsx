import { ClubLanguageProvider } from '@/components/community/ClubLanguage'
import { getClubLocale } from '@/lib/club-locale-server'
import type { Metadata, Viewport } from 'next'
import { Inter, Quicksand } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'LegalOps',
  description: 'Track your job search, outreach, and application pipeline in one place.',
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#F5F1E8' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={getClubLocale()} className={`${inter.variable} ${quicksand.variable}`}>
      <body className="brand-surface antialiased selection:bg-[#E88A6A] selection:text-[#111111]">
        <ClubLanguageProvider initialLocale={getClubLocale()}>{children}</ClubLanguageProvider>
      </body>
    </html>
  )
}
