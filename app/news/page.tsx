import { NewsHome } from '@/components/news/NewsHome'
export const dynamic = 'force-dynamic'
export const metadata = { alternates: { canonical: 'https://legalops.news' } }
export default function NewsPage({ searchParams }: { searchParams?: { assunto?: string; q?: string } }) { return <NewsHome searchParams={searchParams}/> }
