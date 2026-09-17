'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { EVENT_FILE_LIMIT, EVENT_FILE_TYPES } from '@/lib/event-publications'

type Item = { id: string; file: File; preview?: string; prepared?: File; progress: number; status: 'ready' | 'preparing' | 'uploading' | 'saving' | 'done' | 'duplicate' | 'error'; error?: string }

async function prepare(file: File) {
  if (!file.type.startsWith('image/')) return file
  const bitmap = await createImageBitmap(file)
  try {
    const ratio = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio))
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Não foi possível preparar esta foto.')
    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.82))
    if (!blob) throw new Error('Não foi possível preparar esta foto.')
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
  } finally { bitmap.close() }
}

function send(form: FormData, progress: (value: number) => void, saving: () => void) {
  return new Promise<{ duplicate: boolean }>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/community/events/upload')
    xhr.timeout = 120000
    xhr.upload.onprogress = event => { if (event.lengthComputable) progress(Math.round(event.loaded / event.total * 100)) }
    xhr.upload.onload = saving
    xhr.onerror = () => reject(new Error('Conexão interrompida. Tente novamente.'))
    xhr.ontimeout = () => reject(new Error('O envio demorou demais. Tente novamente.'))
    xhr.onload = () => {
      let result
      try { result = JSON.parse(xhr.responseText) } catch { reject(new Error('Não foi possível confirmar o envio. Tente novamente.')); return }
      if (xhr.status >= 200 && xhr.status < 300) resolve(result)
      else reject(new Error(result.error || 'Falha no envio. Tente novamente.'))
    }
    xhr.send(form)
  })
}

export function EventUpload({ eventId, photos }: { eventId: string; photos: boolean }) {
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const lock = useRef(false)
  const publication = useRef<string | null>(null)
  const urls = useRef(new Set<string>())
  useEffect(() => {
    const previews = urls.current
    return () => { previews.forEach(url => URL.revokeObjectURL(url)) }
  }, [])
  useEffect(() => {
    if (!busy) return
    const prevent = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', prevent)
    return () => window.removeEventListener('beforeunload', prevent)
  }, [busy])
  const update = (id: string, patch: Partial<Item>) => setItems(current => current.map(item => item.id === id ? { ...item, ...patch } : item))
  const finished = items.length > 0 && items.every(item => ['done', 'duplicate'].includes(item.status))
  const started = items.some(item => ['done', 'duplicate'].includes(item.status))

  async function select(files: File[]) {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    const next = [...items]
    const notices: string[] = []
    try {
      for (const file of files) {
        if (!EVENT_FILE_TYPES[file.type] || (photos !== file.type.startsWith('image/'))) { notices.push(`${file.name}: formato não aceito nesta aba.`); continue }
        if (!file.size || file.size > EVENT_FILE_LIMIT) { notices.push(`${file.name}: selecione um arquivo de até 10 MB.`); continue }
        const id = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await file.arrayBuffer())), b => b.toString(16).padStart(2, '0')).join('')
        if (next.some(item => item.id === id)) { notices.push(`${file.name}: já selecionado.`); continue }
        if (next.length >= 20) { notices.push('O limite é de 20 arquivos por publicação.'); break }
        const preview = photos ? URL.createObjectURL(file) : undefined
        if (preview) urls.current.add(preview)
        next.push({ id, file, preview, progress: 0, status: 'ready' })
      }
      setItems(next)
      setMessage(notices.join(' '))
    } catch { setMessage('Não foi possível ler a seleção. Tente novamente.') }
    finally { lock.current = false; setBusy(false) }
  }

  async function publish() {
    if (lock.current || !items.length || finished) return
    lock.current = true
    setBusy(true)
    setMessage('')
    publication.current ??= crypto.randomUUID()
    let failures = 0
    let duplicates = 0
    try {
      // One request per file avoids oversized form submissions and limits memory.
      for (const item of items) {
        if (['done', 'duplicate'].includes(item.status)) continue
        try {
          update(item.id, { status: 'preparing', error: undefined, progress: 0 })
          const file = item.prepared ?? await prepare(item.file)
          update(item.id, { prepared: file, status: 'uploading' })
          const form = new FormData()
          form.set('event_id', eventId)
          form.set('publication_id', publication.current)
          form.set('caption', caption)
          form.set('file', file)
          const result = await send(form, progress => update(item.id, { progress }), () => update(item.id, { status: 'saving' }))
          if (result.duplicate) duplicates++
          update(item.id, { status: result.duplicate ? 'duplicate' : 'done', progress: 100 })
        } catch (error) {
          failures++
          update(item.id, { status: 'error', error: error instanceof Error ? error.message : 'Falha no envio.' })
        }
      }
      setMessage(failures ? `${failures} arquivo(s) não foram publicados. Os demais foram preservados. Tente novamente apenas os que falharam.` : duplicates ? 'Envio concluído. Arquivos já publicados foram identificados e não foram repetidos.' : 'Publicação concluída! Confira abaixo.')
      router.refresh()
    } finally { lock.current = false; setBusy(false) }
  }

  function reset() {
    urls.current.forEach(url => URL.revokeObjectURL(url))
    urls.current.clear()
    publication.current = null
    setItems([]); setCaption(''); setMessage('')
  }

  const statusText = (item: Item) => ({ ready: 'Pronto para enviar', preparing: 'Preparando…', uploading: `Enviando ${item.progress}%`, saving: 'Salvando publicação…', done: 'Publicado', duplicate: 'Já publicado · não repetido', error: item.error ?? 'Falha no envio' })[item.status]
  return <form onSubmit={event => { event.preventDefault(); void publish() }} className="mt-5 rounded-xl border border-[#CEC8BD] bg-[#FAF7F1] p-4 sm:p-5" aria-label="Nova publicação do evento">
    <label htmlFor="event-caption" className="text-sm font-semibold text-[#24231F]">Compartilhe este encontro</label>
    <textarea id="event-caption" value={caption} onChange={event => setCaption(event.target.value)} disabled={busy || started} maxLength={1000} rows={3} placeholder="O que você gostaria de compartilhar? (opcional)" className="mt-2 w-full rounded-lg border border-[#CEC8BD] bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-[#C9684F] disabled:opacity-60" />
    <label className="mt-3 block text-sm font-semibold" htmlFor="event-files">{photos ? 'Adicionar fotos' : 'Adicionar documentos'}</label>
    <input id="event-files" type="file" multiple disabled={busy || started} accept={photos ? 'image/jpeg,image/png,image/webp' : 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.doc,.docx'} onChange={event => { const files = Array.from(event.target.files ?? []); event.target.value = ''; void select(files) }} className="mt-2 w-full min-w-0 text-sm file:mr-3 file:min-h-11 file:rounded-lg file:border file:border-[#CEC8BD] file:bg-white file:px-3 file:font-semibold" />
    <p className="mt-2 text-xs text-[#69635E]">Até 20 arquivos, 10 MB cada. {photos ? 'Fotos são otimizadas antes do envio e aparecem juntas em uma publicação.' : 'PDF, DOC e DOCX.'}</p>
    {items.length > 0 && <ul className="mt-4 space-y-3">{items.map(item => <li key={item.id} className="flex min-w-0 items-center gap-3 rounded-lg border border-[#E6DED0] bg-white p-3">
      {item.preview && <img src={item.preview} alt="Prévia da foto selecionada" className="h-14 w-14 shrink-0 rounded-lg object-cover" />}
      <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{item.file.name}</p><p className={`mt-1 text-xs ${item.status === 'error' ? 'text-red-700' : 'text-[#69635E]'}`}>{statusText(item)}</p>{item.status === 'uploading' && <progress aria-label={`Envio de ${item.file.name}`} value={item.progress} max={100} className="mt-1 h-2 w-full accent-[#C9684F]" />}</div>
      {!busy && !['done', 'duplicate'].includes(item.status) && <button type="button" aria-label={`Remover ${item.file.name}`} onClick={() => { if (item.preview) { URL.revokeObjectURL(item.preview); urls.current.delete(item.preview) }; setItems(current => current.filter(value => value.id !== item.id)) }} className="min-h-11 px-2 text-xs font-semibold">Remover</button>}
    </li>)}</ul>}
    <p role="status" aria-live="polite" className="mt-3 text-sm text-[#69635E]">{busy ? 'Envio em andamento. Aguarde a confirmação antes de sair.' : message}</p>
    {finished ? <button type="button" onClick={reset} className="mt-3 min-h-11 rounded-lg bg-[#24231F] px-4 text-sm font-semibold text-white">Nova publicação</button> : <button type="submit" disabled={busy || !items.length} className="mt-3 min-h-11 rounded-lg bg-[#24231F] px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Publicando…' : items.some(item => item.status === 'error') ? 'Tentar novamente os que falharam' : 'Publicar no evento'}</button>}
  </form>
}
