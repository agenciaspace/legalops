import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://legalops.club'),
}

export default function ClubLayout({ children }: { children: React.ReactNode }) {
  return children
}
