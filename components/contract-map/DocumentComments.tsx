'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { MapContribution } from '@/lib/contract-map'
import { commentThreads, type CommentRange, type CommentSelection } from '@/lib/map-comments'
import { CommentComposer } from './CommentComposer'

export type CommentDraft = Partial<CommentSelection> & { parent?: string }
type Props = { section: string; version: number; comments: MapContribution[]; ranges: CommentRange[]; activeId: string | null; draft: CommentDraft | null; isLead: boolean; author: (id: string | null) => string; onActivate: (id: string) => void; onDraft: (draft: CommentDraft | null) => void; onSent: (id?: string) => void; onResolved: () => void; onClose: () => void }

export function DocumentComments(props: Props) {
  const [showResolved, setShowResolved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pane = useRef<HTMLElement>(null)
  const threads = commentThreads(props.comments)
  const open = threads.filter(thread => thread.root.status === 'open')
  const visible = threads.filter(thread => showResolved || thread.root.status === 'open' || thread.root.id === props.activeId)
  useEffect(() => {
    const container = pane.current
    const target = props.draft ? container?.querySelector<HTMLTextAreaElement>('textarea') : document.getElementById(`contribution-${props.activeId}`)
    if (props.draft) target?.focus({ preventScroll: true })
    target?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
  }, [props.activeId, props.draft])
  async function resolve(id: string) {
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/community/contract-map', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'review', id, status: 'resolved', note: 'Discussão resolvida no documento.' }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      props.onResolved()
    } catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível resolver o comentário.') }
    finally { setBusy(false) }
  }
  function entry(item: MapContribution) {
    return <div key={item.id} className="min-w-0"><div className="flex flex-wrap items-baseline justify-between gap-2"><Link href={`/community/members/${item.author_id}`} className="text-sm font-semibold underline">{props.author(item.author_id)}</Link><time dateTime={item.created_at} className="text-[11px] text-[#625E59]">{new Date(item.created_at).toLocaleDateString('pt-BR')}</time></div><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{item.body}</p></div>
  }
  const composer = props.draft && <CommentComposer key={`${props.draft.parent ?? ''}:${props.draft.quote ?? ''}`} section={props.section} version={props.version} {...props.draft} onSent={props.onSent} onClose={() => props.onDraft(null)} />
  return <aside ref={pane} aria-label="Comentários do documento" className={`map-comment-sidebar ${props.activeId || props.draft ? 'is-open' : ''}`}>
    <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-[#CEC8BD] bg-[#F5F1E8] pb-3"><h3 className="text-sm font-semibold">Comentários <span className="font-normal text-[#625E59]">({open.length})</span></h3><button type="button" onClick={props.onClose} className="map-format" aria-label="Fechar comentários">Fechar</button></div>
    <div className="space-y-3 pt-3">
      {composer && !props.draft?.parent && composer}
      {!threads.length && !props.draft && <p className="text-sm leading-6 text-[#625E59]">Selecione um trecho do documento para iniciar uma conversa.</p>}
      {visible.map(({ root, replies }) => <article key={root.id} id={`contribution-${root.id}`} tabIndex={-1} className={`map-comment-card ${root.id === props.activeId ? 'is-active' : ''}`} onClick={() => { if (root.id !== props.activeId) props.onActivate(root.id) }}>
        {root.anchor_quote && <button type="button" className="mb-3 block w-full border-l-2 border-[#D0A436] pl-3 text-left text-xs leading-5 text-[#625E59]" onClick={() => props.onActivate(root.id)}><span className="line-clamp-3">“{root.anchor_quote}”</span><span className="mt-1 block text-[11px]">{props.ranges.some(range => range.id === root.id) ? 'Ver trecho no documento' : root.status === 'resolved' ? 'Conversa resolvida' : 'Trecho não localizado neste texto · citação preservada'}</span></button>}
        {!root.anchor_quote && <p className="mb-3 text-xs text-[#625E59]">Comentário sobre a etapa</p>}
        {entry(root)}
        {replies.length > 0 && <div className="mt-3 space-y-3 border-t border-[#E8E2D8] pt-3">{replies.map(entry)}</div>}
        {root.status === 'resolved' ? <p className="mt-3 text-xs text-[#625E59]">Resolvido{root.review_note ? ` · ${root.review_note}` : ''}</p> : <div className="mt-2 flex flex-wrap gap-1"><button type="button" className="map-format" onClick={() => { props.onActivate(root.id); props.onDraft({ parent: root.id }) }}>Responder</button>{props.isLead && <button type="button" disabled={busy} className="map-format" onClick={() => void resolve(root.id)}>Resolver</button>}</div>}
        {props.draft?.parent === root.id && <div className="mt-3">{composer}</div>}
      </article>)}
      {threads.some(thread => thread.root.status === 'resolved') && <button type="button" className="map-format underline" onClick={() => setShowResolved(!showResolved)}>{showResolved ? 'Ocultar resolvidos' : 'Mostrar resolvidos'}</button>}
      <button type="button" className="map-format underline" onClick={() => props.onDraft({})}>Comentar sobre a etapa</button>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  </aside>
}
