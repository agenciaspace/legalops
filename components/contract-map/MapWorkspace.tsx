'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { MapWorkspace as Workspace, MapNode, MapContribution } from '@/lib/contract-map'
import { MapContent } from './MapContent'
const MapEditor = dynamic(() => import('./MapEditor').then(module => module.MapEditor), { ssr: false, loading: () => <p>Carregando editor…</p> })
const button = 'min-h-11 rounded-xl border border-[#CEC8BD] px-4 py-2 text-sm font-semibold disabled:opacity-50'
export function MapWorkspace() {
  const [data, setData] = useState<Workspace | null>(null)
  const [selected, setSelected] = useState('solicitacao')
  const [tab, setTab] = useState<'document' | 'discussion' | 'history'>('document')
  const [mode, setMode] = useState<'suggest' | 'publish' | null>(null)
  const [draft, setDraft] = useState<MapNode | null>(null)
  const [base, setBase] = useState(0)
  const [note, setNote] = useState('')
  const [license, setLicense] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [reviewing, setReviewing] = useState<MapContribution | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  async function load() {
    const response = await fetch('/api/community/contract-map', { cache: 'no-store' })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error)
    setData(result)
  }
  useEffect(() => {
    setSelected(new URLSearchParams(window.location.search).get('section') || 'solicitacao')
    load().catch(error => setError(error.message))
  }, [])
  useEffect(() => {
    if (!mode) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [mode])
  async function send(payload: Record<string, unknown>, success: string) {
    setBusy(true); setError(''); setMessage('')
    try {
      const response = await fetch('/api/community/contract-map', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setMode(null); setDraft(null); setNote(''); setReviewing(null); setReviewNote(''); setLicense(false); setMessage(success)
      await load()
    } catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível conectar. Seu texto continua aqui.') }
    finally { setBusy(false) }
  }
  const section = data?.sections.find(section => section.id === selected) ?? data?.sections[0]
  const author = (id: string | null) => data?.authors.find(author => author.user_id === id)?.display_name ?? 'Comunidade'
  const contributions = data?.contributions.filter(item => item.section_id === section?.id) ?? []
  const statuses = { open: 'Em discussão', accepted: 'Publicada', rejected: 'Não incorporada', resolved: 'Resolvido' }
  function start(action: 'suggest' | 'publish') { if (!section) return; setDraft(section.content); setBase(section.version); setMode(action); setNote(''); setLicense(false); setError(''); setMessage('') }
  return <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
    <Link href="/community/tools" className="text-sm text-[#625E59] underline">← Ferramentas</Link>
    <div className="mt-4 flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-semibold">Mapa aberto de contratos</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#625E59]">Uma construção da comunidade. Comente ou proponha um texto; membros-lead revisam e publicam as melhorias.</p></div><a className="text-sm underline" href="https://legalops.dev/mapa-contratos/" target="_blank" rel="noreferrer">Ver mapa público ↗</a></div>
    <p className="mt-3 text-xs text-[#625E59]">{data?.isLead ? 'Você é membro-lead: pode revisar sugestões e publicar alterações.' : 'Comentários e propostas ficam entre membros. O texto aprovado fica público sob licença MIT.'}</p>
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {message && <p role="status" className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-800">{message}</p>}
    {!section ? <div className="mt-6"><p>{error ? 'O mapa não carregou.' : 'Carregando mapa…'}</p><button className={button} onClick={() => load().catch(e => setError(e.message))}>Tentar novamente</button></div> : <>
      <div className="mt-6 flex flex-wrap items-end gap-3"><label className="min-w-0 flex-1 text-sm font-semibold">Etapa do contrato<select disabled={!!mode || busy} value={section.id} onChange={e => { setSelected(e.target.value); setNote(''); setReviewing(null); setError(''); setMessage(''); window.history.replaceState(null, '', `?section=${e.target.value}`) }} className="mt-2 block min-h-12 w-full rounded-xl border border-[#CEC8BD] bg-white px-3">{data!.sections.map(item => <option key={item.id} value={item.id}>{item.position}. {item.title}</option>)}</select></label><button className={button} disabled={busy} onClick={() => load().then(() => setMessage('Mapa atualizado. Rascunhos em edição foram preservados.')).catch(e => setError(e.message))}>Atualizar</button></div>
      <nav aria-label="Conteúdo da etapa" className="mt-5 grid grid-cols-3 gap-1 border-b border-[#CEC8BD]">{([['document','Texto aprovado'],['discussion',`Conversas (${contributions.filter(c => c.status === 'open').length})`],['history','Histórico']] as const).map(([id,title]) => <button key={id} disabled={!!mode} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)} className={`min-h-12 border-b-2 px-2 text-xs font-semibold sm:text-sm ${tab === id ? 'border-[#A94E38] text-[#A94E38]' : 'border-transparent text-[#625E59]'}`}>{title}</button>)}</nav>
      {tab === 'document' && <section className="mt-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">{section.title} <span className="text-xs font-normal text-[#625E59]">· versão {section.version}</span></h2>{!mode && <div className="flex flex-wrap gap-2"><button className={button} onClick={() => start('suggest')}>Sugerir alteração</button>{data!.isLead && <button className={`${button} bg-[#24231F] text-white`} onClick={() => start('publish')}>Editar e publicar</button>}</div>}</div>
        {!mode ? <div className="rounded-2xl border border-[#CEC8BD] bg-white p-5 sm:p-7"><MapContent content={section.content} /></div> : <form onSubmit={e => { e.preventDefault(); send({ action: mode, section: section.id, version: base, content: draft, note, license }, mode === 'publish' ? 'Nova versão publicada no mapa público.' : 'Proposta enviada para revisão pelos membros-lead.') }} className="space-y-4">
          <p className="text-sm">{mode === 'suggest' ? 'Proponha uma nova versão desta etapa. O texto atual continua público até a revisão.' : 'Ao publicar, este texto ficará disponível para qualquer pessoa.'}</p>
          {base !== section.version && <div role="alert" className="rounded-xl bg-amber-50 p-4 text-sm">Existe uma versão mais recente. Compare abaixo e ajuste seu texto antes de continuar.<details className="my-3"><summary className="cursor-pointer font-semibold">Ver versão {section.version}</summary><MapContent content={section.content} /></details><button type="button" className={button} onClick={() => setBase(section.version)}>Revisei meu texto com a versão atual</button></div>}
          <MapEditor content={draft!} onChange={setDraft} />
          <label className="block text-sm font-semibold">O que mudou e por quê?<textarea required minLength={3} maxLength={mode === 'publish' ? 1000 : 4000} value={note} onChange={e => setNote(e.target.value)} className="mt-2 block min-h-24 w-full rounded-xl border border-[#CEC8BD] p-3 font-normal" /></label>
          <label className="flex items-start gap-2 text-sm"><input className="mt-1" type="checkbox" required checked={license} onChange={e => setLicense(e.target.checked)} />Autorizo a publicação sob licença MIT. Não incluí dados confidenciais ou pessoais de terceiros.</label>
          <div className="flex flex-wrap gap-2"><button disabled={busy || base !== section.version} className={`${button} bg-[#24231F] text-white`}>{busy ? 'Salvando…' : mode === 'publish' ? 'Publicar versão' : 'Enviar proposta'}</button><button disabled={busy} type="button" className={button} onClick={() => { if (window.confirm('Descartar este rascunho?')) { setMode(null); setDraft(null); setNote('') } }}>Cancelar</button></div>
        </form>}
      </section>}
      {tab === 'discussion' && <section className="mt-5 space-y-4"><form onSubmit={e => { e.preventDefault(); send({ action: 'comment', section: section.id, version: section.version, note }, 'Comentário publicado para a comunidade.') }} className="rounded-2xl border border-[#CEC8BD] bg-white p-4"><label className="block text-sm font-semibold">Pergunta ou comentário<textarea required minLength={3} maxLength={4000} value={note} onChange={e => setNote(e.target.value)} placeholder="O que podemos melhorar nesta etapa?" className="mt-2 block min-h-24 w-full rounded-xl border border-[#CEC8BD] p-3 font-normal" /></label><button disabled={busy} className={`${button} mt-3 bg-[#24231F] text-white`}>{busy ? 'Enviando…' : 'Comentar'}</button></form>
        {!contributions.length && <p className="py-4 text-sm text-[#625E59]">Nenhuma contribuição nesta etapa ainda. Comece a conversa.</p>}
        {contributions.map(item => <article key={item.id} className="rounded-2xl border border-[#CEC8BD] bg-white p-4 sm:p-5"><div className="flex flex-wrap justify-between gap-2 text-sm"><Link className="font-semibold underline" href={`/community/members/${item.author_id}`}>{author(item.author_id)}</Link><span className="text-xs text-[#625E59]">{item.kind === 'suggestion' ? 'Proposta' : 'Comentário'} · {statuses[item.status]}</span></div><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">{item.body}</p>{item.proposed_content && <details className="mt-3"><summary className="cursor-pointer text-sm font-semibold">Comparar proposta · baseada na versão {item.base_version}</summary><div className="mt-3 grid gap-4 md:grid-cols-2"><div className="rounded-xl bg-[#FAF7F1] p-4"><p className="mb-3 text-xs font-bold">Texto atual · v{section.version}</p><MapContent content={section.content} /></div><div className="rounded-xl border border-[#CEC8BD] p-4"><p className="mb-3 text-xs font-bold">Texto proposto</p><MapContent content={item.proposed_content} /></div></div></details>}{item.review_note && <p className="mt-3 border-l-2 border-[#A94E38] pl-3 text-sm">{author(item.reviewer_id)}: {item.review_note}</p>}
          {data!.isLead && item.status === 'open' && <button disabled={busy} className={`${button} mt-3`} onClick={() => { setReviewing(item); setReviewNote('') }}>Revisar</button>}
          {reviewing?.id === item.id && <div className="mt-3 space-y-3 border-t border-[#CEC8BD] pt-3"><label className="block text-sm">Explique sua decisão<textarea minLength={3} maxLength={1000} value={reviewNote} onChange={e => setReviewNote(e.target.value)} className="mt-2 block w-full rounded-xl border p-3" /></label>{item.kind === 'suggestion' && item.base_version !== section.version && <p className="text-sm text-amber-800">A etapa mudou desde esta proposta. Incorpore os pontos úteis em “Editar e publicar” e registre a decisão aqui.</p>}<div className="flex flex-wrap gap-2">{item.kind === 'suggestion' && <button disabled={busy || reviewNote.trim().length < 3 || item.base_version !== section.version} className={`${button} bg-[#24231F] text-white`} onClick={() => send({ action: 'accept', id: item.id, section: section.id, version: section.version, content: item.proposed_content, note: reviewNote }, 'Sugestão aceita e nova versão publicada.')}>Aceitar e publicar</button>}<button disabled={busy || reviewNote.trim().length < 3} className={button} onClick={() => send({ action: 'review', id: item.id, status: item.kind === 'comment' ? 'resolved' : 'rejected', note: reviewNote }, 'Decisão registrada.')}>{item.kind === 'comment' ? 'Marcar resolvido' : 'Não incorporar'}</button><button disabled={busy} className={button} onClick={() => setReviewing(null)}>Cancelar</button></div></div>}
        </article>)}<p className="text-xs text-[#625E59]">São exibidas as contribuições mais recentes (até 500 no mapa).</p>
      </section>}
      {tab === 'history' && <section className="mt-5 space-y-3">{data!.revisions.filter(item => item.section_id === section.id).map(item => <details key={item.version} className="rounded-xl border border-[#CEC8BD] bg-white p-4"><summary className="cursor-pointer text-sm"><strong>Versão {item.version}</strong> · {author(item.editor_id)} · {new Date(item.created_at).toLocaleDateString('pt-BR')}<span className="mt-1 block text-[#625E59]">{item.note}</span></summary><div className="mt-4"><MapContent content={item.content} /></div></details>)}<p className="text-xs text-[#625E59]">Últimas 100 revisões do mapa. As anteriores permanecem preservadas.</p></section>}
    </>}
  </main>
}
