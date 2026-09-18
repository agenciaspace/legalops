'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

type Photo = { id: string; source: string }

export function EventPhotoGallery({ photos, author }: { photos: Photo[]; author: string }) {
  const [selected, setSelected] = useState<number | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement | null>(null)
  const touchStart = useRef<number | null>(null)
  const open = selected !== null

  useEffect(() => {
    if (!open) return
    const element = dialog.current
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    element?.showModal()
    return () => {
      element?.close()
      document.body.style.overflow = overflow
      trigger.current?.focus()
    }
  }, [open])

  function navigate(offset: number) {
    if (photos.length < 2) return
    setStatus('loading')
    setSelected(index => index === null ? null : (index + offset + photos.length) % photos.length)
  }

  return <>
    <div className={`grid gap-1 bg-[#FAF7F1] ${photos.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {photos.map((photo, index) => <button key={photo.id} type="button" aria-label={`Ampliar foto ${index + 1} de ${photos.length}`} className="block w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C9684F]" onClick={event => { trigger.current = event.currentTarget; setStatus('loading'); setSelected(index) }}>
        <img src={photo.source} alt={`Foto ${index + 1} do encontro, compartilhada por ${author}`} loading="lazy" className={`w-full ${photos.length === 1 ? 'max-h-[36rem] object-contain' : 'aspect-square object-cover'}`} />
      </button>)}
    </div>
    <dialog ref={dialog} aria-label="Fotos do evento" onCancel={() => setSelected(null)} onClose={() => setSelected(null)} onClick={event => { if (event.target === event.currentTarget) setSelected(null) }} onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); navigate(event.key === 'ArrowRight' ? 1 : -1) } }} className="m-auto h-[92dvh] max-h-[92dvh] w-[calc(100%-1rem)] max-w-5xl overflow-hidden rounded-2xl border-0 bg-[#171715] p-0 text-white shadow-xl backdrop:bg-black/75">
      {selected !== null && <div className="flex h-full min-h-0 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-2">
          <div className="min-w-0"><p aria-live="polite" className="text-sm font-semibold">Foto {selected + 1} de {photos.length}</p><p className="truncate text-xs text-white/70">Compartilhada por {author}</p></div>
          <button autoFocus type="button" aria-label="Fechar fotos" className="flex min-h-12 min-w-12 items-center justify-center rounded-lg hover:bg-white/10" onClick={() => setSelected(null)}><X aria-hidden="true" className="h-5 w-5" /></button>
        </header>
        <div className="relative flex min-h-0 flex-1 items-center justify-center" onTouchStart={event => { touchStart.current = event.touches.length === 1 ? event.touches[0].clientX : null }} onTouchEnd={event => { const start = touchStart.current; touchStart.current = null; if (start !== null && event.changedTouches[0]) { const distance = event.changedTouches[0].clientX - start; if (Math.abs(distance) > 60) navigate(distance < 0 ? 1 : -1) } }}>
          {status === 'loading' && <p role="status" className="absolute text-sm">Carregando foto…</p>}
          {status === 'error' ? <p role="alert" className="px-6 text-center text-sm">Não foi possível carregar a foto. Feche e tente novamente.</p> : <img key={photos[selected].id} src={photos[selected].source} alt={`Foto ${selected + 1} do encontro, compartilhada por ${author}`} onLoad={() => setStatus('ready')} onError={() => setStatus('error')} className={`h-full min-h-0 w-full object-contain ${status === 'loading' ? 'invisible' : ''}`} />}
        </div>
        {photos.length > 1 && <nav aria-label="Navegar pelas fotos" className="flex shrink-0 items-center justify-between gap-3 px-4 py-2">
          <button type="button" onClick={() => navigate(-1)} className="inline-flex min-h-12 items-center gap-2 rounded-lg px-3 hover:bg-white/10"><ChevronLeft aria-hidden="true" className="h-5 w-5" />Anterior</button>
          <button type="button" onClick={() => navigate(1)} className="inline-flex min-h-12 items-center gap-2 rounded-lg px-3 hover:bg-white/10">Próxima<ChevronRight aria-hidden="true" className="h-5 w-5" /></button>
        </nav>}
      </div>}
    </dialog>
  </>
}
