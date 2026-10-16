import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { isLegalOpsAdminEmail } from '@/lib/legalops-admin'
import { NewsEditor } from '@/components/news/NewsEditor'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Redação | legalops.news', robots: { index: false } }
export default async function NewsManagePage() {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user || !isLegalOpsAdminEmail(user.email)) redirect('/community/news')
  return <div className="mx-auto max-w-[1180px] p-4 sm:p-6"><h1 className="text-3xl font-semibold tracking-tight">Redação do legalops.news</h1><NewsEditor/></div>
}
