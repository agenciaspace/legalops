import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { generateOpenRouterText } from '@/lib/openrouter'
import { DAY_MS, parseWhatsAppDigest, validateWhatsAppInput, whatsAppDigestPrompt, WHATSAPP_SUMMARY_MODEL } from '@/lib/whatsapp-summary'
import { BENCH_WHATSAPP_SOURCES, BENCH_WHATSAPP_SYNC_MODEL, benchSchedulePrompt, extractExplicitBenchSchedule, parseBenchScheduleDecision, validateBenchSyncInput } from '@/lib/bench-whatsapp-sync'
import { EVENT_WHATSAPP_SUMMARY_MODEL, eventWhatsAppDigestPrompt, validateEventWhatsAppInput } from '@/lib/event-whatsapp-summary'
export const dynamic = 'force-dynamic'
export const maxDuration = 60
const reply = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } })
export async function POST(request: Request) {
  const secret = process.env.WHATSAPP_SUMMARY_INGEST_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return reply({ error: 'Unauthorized' }, 401)
  const text = await request.text()
  if (text.length > 300000) return reply({ error: 'Payload too large' }, 413)
  let raw
  try { raw = JSON.parse(text) } catch { return reply({ error: 'Invalid JSON' }, 400) }
  const db = createAdminClient()
  if (raw?.action === 'pull-event-comments') {
    const { data: pending, error } = await db
      .from('community_event_whatsapp_outbox')
      .select('id,event_id,comment_id,attempt_count,created_at')
      .is('delivered_at', null)
      .order('created_at', { ascending: true })
      .limit(10)
    if (error) return reply({ error: 'Event comment queue unavailable' }, 503)

    const notifications = []
    for (const item of pending ?? []) {
      const { data: comment } = await db.from('community_comments').select('post_id,author_name,body,created_at').eq('id', item.comment_id).maybeSingle()
      if (!comment) continue
      const { data: post } = await db.from('community_posts').select('event_id,topic_id').eq('id', comment.post_id).maybeSingle()
      if (!post?.event_id || post.event_id !== item.event_id) continue
      const [{ data: event }, { data: topic }, { data: config }] = await Promise.all([
        db.from('community_events').select('slug').eq('id', post.event_id).eq('is_published', true).maybeSingle(),
        post.topic_id ? db.from('community_forum_topics').select('title').eq('id', post.topic_id).maybeSingle() : Promise.resolve({ data: null }),
        db.from('community_event_whatsapp_configs').select('group_jid,enabled').eq('event_id', post.event_id).eq('enabled', true).maybeSingle(),
      ])
      if (!event || !topic || !config) continue
      notifications.push({ id: item.id, group_id: config.group_jid, event_slug: event.slug, topic: topic.title, author: comment.author_name, body: comment.body, created_at: comment.created_at })
      await db.from('community_event_whatsapp_outbox').update({ attempt_count: item.attempt_count + 1, last_attempt_at: new Date().toISOString() }).eq('id', item.id).is('delivered_at', null)
    }
    return reply({ ok: true, notifications })
  }
  if (raw?.action === 'delivered-event-comment') {
    if (typeof raw.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(raw.id) || (raw.message_id != null && typeof raw.message_id !== 'string')) return reply({ error: 'Invalid delivery' }, 400)
    const { error } = await db.from('community_event_whatsapp_outbox').update({ delivered_at: new Date().toISOString(), provider_message_id: raw.message_id?.slice(0, 300) || null }).eq('id', raw.id).is('delivered_at', null)
    return error ? reply({ error: 'Delivery status unavailable' }, 503) : reply({ ok: true })
  }
  if (raw?.action === 'sync-bench-event') {
    const input = validateBenchSyncInput(raw)
    if (!input) return reply({ error: 'Invalid Bench source or messages' }, 400)
    const source = BENCH_WHATSAPP_SOURCES[input.groupId]
    try {
      const explicitDecision = extractExplicitBenchSchedule(input.messages, source.timeZone)
      const decision = explicitDecision ?? parseBenchScheduleDecision(await generateOpenRouterText({
          systemPrompt: 'Você extrai decisões de agenda de forma conservadora. Nunca trate uma sugestão como confirmação.',
          userPrompt: benchSchedulePrompt(input.messages, new Date(), source.timeZone),
          model: BENCH_WHATSAPP_SYNC_MODEL,
          maxTokens: 350,
          temperature: 0,
          timeoutMs: 45_000,
        }), input.messages)
      if (!decision) return reply({ error: 'Schedule extraction was inconclusive' }, 503)
      if (!decision.confirmed) return reply({ ok: true, confirmed: false })

      const { data: event, error: readError } = await db
        .from('community_events')
        .select('id,starts_at,ends_at,location_label,participation_details')
        .eq('slug', source.eventSlug)
        .eq('is_published', true)
        .maybeSingle()
      if (readError || !event) return reply({ error: 'Bench event unavailable' }, 503)

      const changed = event.starts_at !== decision.startsAt
        || (event.ends_at ?? null) !== decision.endsAt
        || /data a confirmar/i.test(event.location_label ?? '')
        || /data e hor[aá]rio a confirmar/i.test(event.participation_details ?? '')
      if (changed) {
        const { error: updateError } = await db.from('community_events').update({
          starts_at: decision.startsAt,
          ends_at: decision.endsAt,
          location_label: source.locationLabelAfterSchedule,
          participation_details: source.participationDetailsAfterSchedule,
        }).eq('id', event.id)
        if (updateError) return reply({ error: 'Bench event update failed' }, 503)
      }
      return reply({ ok: true, confirmed: true, updated: changed, event_slug: source.eventSlug, starts_at: decision.startsAt })
    } catch {
      console.error('[bench-whatsapp-sync] Schedule extraction or update failed')
      return reply({ error: 'Bench schedule sync will retry' }, 503)
    }
  }
  if (raw?.action === 'delivered') {
    if (typeof raw.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(raw.id)) return reply({error:'Invalid delivery'},400)
    const { error } = await db.from('club_whatsapp_summaries').update({ whatsapp_sent_at: new Date().toISOString() }).eq('id', raw.id).is('whatsapp_sent_at', null)
    return error ? reply({ error: 'Delivery status unavailable' }, 503) : reply({ok:true})
  }
  if (raw?.action === 'delivered-event') {
    if (typeof raw.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(raw.id)) return reply({ error: 'Invalid delivery' }, 400)
    const { error } = await db.from('community_event_whatsapp_summaries').update({ whatsapp_sent_at: new Date().toISOString() }).eq('id', raw.id).is('whatsapp_sent_at', null)
    return error ? reply({ error: 'Delivery status unavailable' }, 503) : reply({ ok: true })
  }

  const eventInput = validateEventWhatsAppInput(raw)
  if (eventInput) {
    const { data: event, error: eventError } = await db.from('community_events').select('id,title').eq('slug', eventInput.eventSlug).eq('is_published', true).maybeSingle()
    if (eventError || !event) return reply({ error: 'Event unavailable' }, 503)
    const { data: schedule, error: scheduleError } = await db.from('community_event_whatsapp_configs').select('*').eq('event_id', event.id).single()
    if (scheduleError || !schedule) return reply({ error: 'Event summary schedule unavailable' }, 503)
    if (!schedule.enabled && !eventInput.preview) return reply({ error: 'Event summary paused' }, 409)
    if (!eventInput.preview && new Date(eventInput.end) < new Date(schedule.first_run_at)) return reply({ error: 'Before first scheduled period' }, 409)
    const { data: existing, error: readError } = await db.from('community_event_whatsapp_summaries').select('*').eq('event_id', event.id).eq('period_end', eventInput.end).maybeSingle()
    if (readError) return reply({ error: 'Event summary unavailable' }, 503)
    const status = async (last_status: string) => {
      if (eventInput.preview) return
      const done = last_status === 'published' || last_status === 'empty'
      const { error } = await db.from('community_event_whatsapp_configs').update({ last_status, last_checked_at: new Date().toISOString(), last_period_end: eventInput.end, ...(done ? { next_run_at: new Date(new Date(eventInput.end).getTime() + DAY_MS).toISOString() } : {}) }).eq('event_id', event.id)
      if (error) throw new Error('Event schedule update failed')
    }
    try {
      if (existing && !eventInput.preview) { await status('published'); return reply({ ok: true, summary: existing, reused: true }) }
      if (!eventInput.messages.length) { await status('empty'); return reply({ ok: true, empty: true }) }
      await status('generating')
      const generated = await generateOpenRouterText({
        systemPrompt: 'Você edita uma síntese factual e anônima para participantes de um evento profissional. Nunca exponha nomes, empresas ou dados de contato.',
        userPrompt: eventWhatsAppDigestPrompt(eventInput.messages, event.title),
        model: EVENT_WHATSAPP_SUMMARY_MODEL,
        maxTokens: 1800,
        temperature: 0,
        timeoutMs: 45_000,
      })
      const digest = parseWhatsAppDigest(generated)
      if (!digest) throw new Error('Invalid generated event summary')
      if (!digest.publish) { await status('empty'); return reply({ ok: true, empty: true, reason: 'no-substantive-content' }) }
      const { publish: _publish, ...content } = digest
      const record = { ...content, event_id: event.id, period_start: eventInput.start, period_end: eventInput.end, source_message_count: eventInput.messages.length, source_participant_count: new Set(eventInput.messages.map(item => item.author)).size, omitted_media_count: eventInput.omitted, model: EVENT_WHATSAPP_SUMMARY_MODEL }
      if (eventInput.preview) return reply({ ok: true, preview: true, summary: record })
      const { data: saved, error } = await db.from('community_event_whatsapp_summaries').upsert(record, { onConflict: 'event_id,period_end', ignoreDuplicates: true }).select('*').maybeSingle()
      if (error) throw new Error('Event summary insert failed')
      const committed = saved ?? (await db.from('community_event_whatsapp_summaries').select('*').eq('event_id', event.id).eq('period_end', eventInput.end).single()).data
      if (!committed) throw new Error('Event summary lookup failed')
      await status('published')
      return reply({ ok: true, summary: committed })
    } catch {
      await status('error').catch(() => {})
      console.error('[event-whatsapp-summary] Generation or persistence failed; scheduled retry required')
      return reply({ error: 'Resumo em preparação. Uma nova tentativa será feita.' }, 503)
    }
  }
  const input = validateWhatsAppInput(raw)
  if (!input) return reply({ error: 'Invalid source, period or messages' }, 400)
  const { data: schedule, error: scheduleError } = await db.from('club_whatsapp_summary_schedule').select('*').eq('id','community').single()
  if (scheduleError || !schedule) return reply({error:'Schedule unavailable'},503)
  if (!schedule.enabled && !input.preview) return reply({error:'Summary paused'},409)
  if (!input.preview && new Date(input.end) < new Date(schedule.first_run_at)) return reply({error:'Before first scheduled period'},409)
  const { data: existing, error: readError } = await db.from('club_whatsapp_summaries').select('*').eq('period_end',input.end).maybeSingle()
  if (readError) return reply({error:'Summary unavailable'},503)
  const status = async (last_status: string) => {
    if (input.preview) return
    const done = last_status === 'published' || last_status === 'empty'
    const { error } = await db.from('club_whatsapp_summary_schedule').update({last_status,last_checked_at:new Date().toISOString(),last_period_end:input.end,...(done?{next_run_at:new Date(new Date(input.end).getTime()+DAY_MS).toISOString()}:{} )}).eq('id','community')
    if (error) throw new Error('Schedule update failed')
  }
  try {
    if (existing && !input.preview) { await status('published'); return reply({ok:true,summary:existing,reused:true}) }
    if (!input.messages.length) { await status('empty'); return reply({ok:true,empty:true}) }
    await status('generating')
    const generated = await generateOpenRouterText({systemPrompt:'Você edita um briefing factual e específico para profissionais de Legal Operations. Use apenas as fontes fornecidas, elimine conversa social sem informação e escreva em português do Brasil.',userPrompt:whatsAppDigestPrompt(input.messages),model:WHATSAPP_SUMMARY_MODEL,maxTokens:1800,temperature:0,timeoutMs:45000})
    const digest = parseWhatsAppDigest(generated)
    if (!digest) throw new Error('Invalid generated summary')
    if (!digest.publish) { await status('empty'); return reply({ok:true,empty:true,reason:'no-substantive-content'}) }
    const { publish: _publish, ...content } = digest
    const record = {...content,period_start:input.start,period_end:input.end,source_message_count:input.messages.length,source_participant_count:new Set(input.messages.map(item=>item.author)).size,omitted_media_count:input.omitted,model:WHATSAPP_SUMMARY_MODEL}
    if (input.preview) return reply({ok:true,preview:true,summary:record})
    const { data: saved, error } = await db.from('club_whatsapp_summaries').upsert(record,{onConflict:'period_end',ignoreDuplicates:true}).select('*').maybeSingle()
    if (error) throw new Error('Summary insert failed')
    const committed = saved ?? (await db.from('club_whatsapp_summaries').select('*').eq('period_end',input.end).single()).data
    if (!committed) throw new Error('Summary lookup failed')
    await status('published')
    return reply({ok:true,summary:committed})
  } catch {
    await status('error').catch(()=>{})
    console.error('[whatsapp-summary] Generation or persistence failed; scheduled retry required')
    return reply({error:'Resumo em preparação. Uma nova tentativa será feita.'},503)
  }
}
