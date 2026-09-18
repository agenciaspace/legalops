import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { translateClubPayload, TRANSLATION_MODEL } from '@/lib/club-translation-model'

export const maxDuration = 60
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = createAdminClient()
  const { data: jobs, error } = await admin.rpc('claim_club_translations', { batch_size: 3 })
  if (error) return NextResponse.json({ error: 'translation_queue_unavailable' }, { status: 503 })
  const results = await Promise.all((jobs ?? []).map(async (job: { id: string; revision: number; lease_token: string; attempts: number; payload: Parameters<typeof translateClubPayload>[0]; locale_hint: string | null }) => {
    try {
      const translated = await translateClubPayload(job.payload, job.locale_hint, process.env.OPENROUTER_API_KEY ?? '')
      const { data: applied, error: saveError } = await admin.from('club_translation_sources').update({ translations: translated.translations, detected_locale: translated.detected_locale, status: 'ready', model: TRANSLATION_MODEL, lease_expires_at: null }).eq('id', job.id).eq('revision', job.revision).eq('lease_token', job.lease_token).select('id')
      if (saveError) throw new Error('translation_save_failed')
      await admin.from('club_translation_runs').update({ status: applied?.length ? 'ready' : 'superseded', actual_usd: typeof translated.usage.cost === 'number' && Number.isFinite(translated.usage.cost) && translated.usage.cost >= 0 ? translated.usage.cost : null, input_tokens: translated.usage.prompt_tokens ?? null, output_tokens: translated.usage.completion_tokens ?? null }).eq('id', job.lease_token)
      return applied?.length ? 'ready' : 'superseded'
    } catch {
      await admin.from('club_translation_sources').update({ status: job.attempts >= 3 ? 'failed' : 'pending', next_attempt_at: new Date(Date.now() + job.attempts * 60000).toISOString(), lease_expires_at: null }).eq('id', job.id).eq('revision', job.revision).eq('lease_token', job.lease_token)
      await admin.from('club_translation_runs').update({ status: 'failed' }).eq('id', job.lease_token)
      return 'failed'
    }
  }))
  return NextResponse.json({ processed: results.length, ready: results.filter(result => result === 'ready').length, failed: results.filter(result => result === 'failed').length })
}
