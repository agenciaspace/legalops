'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { isLegalOpsAdminEmail } from '@/lib/legalops-admin'
import { parseBenchContent } from '@/lib/bench-contributions'

export async function reviewBenchContribution(form: FormData) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isLegalOpsAdminEmail(user.email)) throw new Error('Forbidden')
  const decision = String(form.get('decision') || '')
  const id = String(form.get('id') || '')
  const note = String(form.get('review_note') || '').trim()
  if (!/^[0-9a-f-]{36}$/i.test(id) || !['approve', 'reject', 'withdraw'].includes(decision) || note.length < 10 || note.length > 700) redirect('/club/admin/bench?error=review')
  let content = null
  if (decision === 'approve') {
    if (form.get('verified') !== 'on') redirect('/club/admin/bench?error=verification')
    try { content = parseBenchContent(Object.fromEntries(form.entries())) }
    catch { redirect('/club/admin/bench?error=content') }
  }
  const admin = createAdminClient()
  const { error } = decision === 'withdraw'
    ? await admin.rpc('withdraw_bench_publication', { publication_uuid: id, reviewer_uuid: user.id, note })
    : await admin.rpc('review_bench_contribution', { submission_uuid: id, reviewer_uuid: user.id, decision, note, reviewed_content: content })
  if (error) redirect('/club/admin/bench?error=save')
  revalidatePath('/club/admin/bench')
  redirect('/club/admin/bench?saved=1')
}
