import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const inter = localFont({
  src: [
    { path: '../public/fonts/inter-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/inter-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/inter-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/inter-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-sans',
  display: 'swap',
})

const lora = localFont({
  src: [
    { path: '../public/fonts/lora-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/lora-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/lora-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/lora-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'LegalOps',
  description: 'Track your job search, outreach, and application pipeline in one place.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${lora.variable}`}>
      <body className="bg-white font-sans text-slate-900 antialiased">{children}</body>
    </html>
  )
}
