import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { hasActiveClubAccess } from '@/lib/community'
import { EVENT_FILE_LIMIT, EVENT_FILE_TYPES, fileMatchesType } from '@/lib/event-publications'

const fail = (error: string, status: number) => NextResponse.json({ error }, { status })
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return fail('Origem inválida.', 403)
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Entre novamente para publicar.', 401)
  const { data: member } = await supabase.from('community_members').select('club_access_status,club_access_expires_at').eq('user_id', user.id).maybeSingle()
  if (!hasActiveClubAccess(member)) return fail('É necessário ser membro da comunidade.', 403)
  if (Number(request.headers.get('content-length')) > EVENT_FILE_LIMIT + 65536) return fail('O arquivo ultrapassa 10 MB.', 413)
  let form: FormData
  try { form = await request.formData() } catch { return fail('Não foi possível ler o arquivo.', 400) }
  const eventId = String(form.get('event_id') ?? '')
  const publicationId = String(form.get('publication_id') ?? '')
  const caption = String(form.get('caption') ?? '').trim().slice(0, 1000)
  const file = form.get('file')
  if (!uuid.test(eventId) || !uuid.test(publicationId)) return fail('Evento ou publicação inválidos.', 400)
  if (!(file instanceof File) || !file.size || !EVENT_FILE_TYPES[file.type]) return fail('Selecione JPG, PNG, WEBP, PDF, DOC ou DOCX.', 400)
  if (file.size > EVENT_FILE_LIMIT) return fail('O arquivo ultrapassa 10 MB.', 413)
  const [{ data: event }, { data: attendee }, { data: organizer }] = await Promise.all([
    supabase.from('community_events').select('id').eq('id', eventId).eq('is_published', true).maybeSingle(),
    supabase.from('community_event_rsvps').select('id').eq('event_id', eventId).eq('user_id', user.id).eq('response', 'confirmed').maybeSingle(),
    supabase.from('community_event_admins').select('event_id').eq('event_id', eventId).eq('user_id', user.id).maybeSingle(),
  ])
  if (!event || (!attendee && !organizer)) return fail('Somente participantes confirmados e organizadores podem publicar.', 403)
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (!fileMatchesType(bytes, file.type)) return fail('O conteúdo não corresponde ao formato do arquivo.', 400)
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('')
  const admin = createAdminClient()
  const findExisting = () => admin.from('community_event_resources').select('id,publication_id').eq('event_id', eventId).eq('uploader_id', user.id).eq('content_hash', hash).is('duplicate_of', null).maybeSingle()
  const { data: existing, error: lookupError } = await findExisting()
  if (lookupError) return fail('Não foi possível verificar o envio. Tente novamente.', 503)
  if (existing) return NextResponse.json({ ...existing, duplicate: true })
  const path = `${eventId}/${user.id}/${crypto.randomUUID()}.${EVENT_FILE_TYPES[file.type]}`
  const bucket = admin.storage.from('community-event-files')
  const { error: uploadError } = await bucket.upload(path, bytes, { contentType: file.type, upsert: false })
  if (uploadError) return fail('Falha ao enviar o arquivo. Tente novamente.', 503)
  const { data, error } = await admin.from('community_event_resources').insert({
    event_id: eventId, uploader_id: user.id, publication_id: publicationId,
    title: file.name.slice(0, 160), description: caption || null,
    kind: file.type.startsWith('image/') ? 'foto' : 'documento',
    storage_path: path, resource_url: null, content_hash: hash,
  }).select('id,publication_id').single()
  if (error) {
    await bucket.remove([path])
    // The unique index also handles simultaneous requests and uncertain retries.
    if (error.code === '23505') {
      const { data: raced } = await findExisting()
      if (raced) return NextResponse.json({ ...raced, duplicate: true })
    }
    return fail('O arquivo não foi publicado. Tente novamente.', 503)
  }
  return NextResponse.json({ ...data, duplicate: false }, { status: 201 })
}
