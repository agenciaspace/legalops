import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LegalOps',
  description: 'Track your job search, outreach, and application pipeline in one place.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#F5F4F0] text-[#1A1A1A] antialiased selection:bg-[#FF6A00] selection:text-white">{children}</body>
    </html>
  )
}
