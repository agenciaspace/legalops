import { notFound } from 'next/navigation'
import { NewsHome } from '@/components/news/NewsHome'
import { NEWS_AUDIENCES, isNewsAudience } from '@/lib/news'
export const dynamic = 'force-dynamic'
export function generateMetadata({ params }: { params: { audience: string } }) {
  if (!isNewsAudience(params.audience)) return {}
  return { title: NEWS_AUDIENCES[params.audience].label, description: NEWS_AUDIENCES[params.audience].description, alternates: { canonical: `https://legalops.news/${params.audience}` } }
}
export default function AudiencePage({ params, searchParams }: { params: { audience: string }; searchParams?: { assunto?: string; q?: string } }) {
  if (!isNewsAudience(params.audience)) notFound()
  return <NewsHome audience={params.audience} searchParams={searchParams}/>
}
