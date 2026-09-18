'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { MIGRATION_PHASES, MIGRATION_STAGES, LEGACY_MAP_SECTION_IDS } from '@/lib/contract-map'
import type { MapWorkspace as Workspace, MapNode, MapContribution } from '@/lib/contract-map'
import { DocumentComments, type CommentDraft } from './DocumentComments'
import { commentRanges, commentTextIndex, commentThreads, makeCommentSelection, type CommentSelection } from '@/lib/map-comments'
import { MentionField } from './MentionField'
import { ChangeReview } from './ChangeReview'
import { mapChanges } from '@/lib/map-diff'
import { MapContent } from './MapContent'
const MapEditor = dynamic(() => import('./MapEditor').then(module => module.MapEditor), { ssr: false, loading: () => <p>Carregando editor…</p> })
const button = 'min-h-11 rounded-xl border border-[#CEC8BD] px-4 py-2 text-sm font-semibold disabled:opacity-50'
export function MapWorkspace() {
  const approvedRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<Workspace | null>(null)
  const [selected, setSelected] = useState('contexto')
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
  const [decisions,setDecisions]=useState<(boolean|null)[]>([])
  const [editorReady,setEditorReady]=useState(false)
  const [editorMentions,setEditorMentions]=useState<string[]>([])
  const [noteMentions,setNoteMentions]=useState<string[]>([])
  const [selection,setSelection]=useState<CommentSelection|null>(null)
  const [comment,setComment]=useState<CommentDraft|null>(null)
  const [activeComment,setActiveComment]=useState<string|null>(null)
  const [preservedDraft,setPreservedDraft]=useState<MapNode|null>(null)
  async function load() {
    const response = await fetch('/api/community/contract-map', { cache: 'no-store' })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error)
    setData(result)
  }
  useEffect(() => {
    setSelected(new URLSearchParams(window.location.search).get('section') || 'contexto')
    if(window.location.hash.startsWith('#contribution-'))setActiveComment(window.location.hash.slice(14))
    load().catch(error => setError(error.message))
  }, [])
  useEffect(() => {
    const select = () => {
      const selected=window.getSelection(), root=approvedRef.current
      if(!root || !selected?.rangeCount) return
      const range=selected.getRangeAt(0)
      if(!root.contains(range.startContainer)||!root.contains(range.endContainer)) return
      if(range.collapsed){setSelection(null);return}
      const spans=Array.from(root.querySelectorAll<HTMLElement>('span[data-map-text-start]')).filter(span=>range.intersectsNode(span))
      if(!spans.length)return
      const offset=(span:HTMLElement,node:Node,at:number,fallback:number)=>{if(!span.contains(node))return fallback;const before=document.createRange();before.selectNodeContents(span);before.setEnd(node,at);return before.toString().length}
      const first=spans[0],last=spans[spans.length-1]
      const content=data?.sections.find(item=>item.id===selectedSection.current)?.content
      if(!content)return
      setSelection(makeCommentSelection(commentTextIndex(content).text,Number(first.dataset.mapTextStart)+offset(first,range.startContainer,range.startOffset,0),Number(last.dataset.mapTextStart)+offset(last,range.endContainer,range.endOffset,last.textContent?.length??0),'published'))
    }
    document.addEventListener('selectionchange',select);return()=>document.removeEventListener('selectionchange',select)
  },[data])
  const selectedSection=useRef(selected);selectedSection.current=selected
  useEffect(()=>{
    if(!data||!activeComment)return
    const item=data.contributions.find(item=>item.id===activeComment)
    if(item?.kind==='suggestion'){setTab('discussion');return}
    if(item?.parent_id){const thread=commentThreads(data.contributions).find(thread=>thread.replies.some(reply=>reply.id===activeComment));if(thread)setActiveComment(thread.root.id)}
  },[data,activeComment])
  useEffect(() => { const timer=setInterval(()=>{if(document.visibilityState==='visible')load().catch(()=>{})},15000);return()=>clearInterval(timer) }, [])
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
      setMode(null); setDraft(null); setEditorMentions([]); setNoteMentions([]); setDecisions([]); setNote(''); setReviewing(null); setReviewNote(''); setLicense(false); setMessage(success)
      await load()
    } catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível conectar. Seu texto continua aqui.') }
    finally { setBusy(false) }
  }
  const archived = (LEGACY_MAP_SECTION_IDS as readonly string[]).includes(selected)
  const sections = data?.sections.filter(item => archived ? (LEGACY_MAP_SECTION_IDS as readonly string[]).includes(item.id) : MIGRATION_STAGES.some(stage => stage.id === item.id)) ?? []
  const section = sections.find(section => section.id === selected) ?? sections[0]
  const stageIndex = sections.findIndex(item => item.id === section?.id)
  const phase = MIGRATION_STAGES.find(item => item.id === section?.id)?.phase
  function navigate(id: string) { setSelected(id); setNote(''); setReviewing(null); setSelection(null); setComment(null); setActiveComment(null); setError(''); setMessage(''); window.history.replaceState(null, '', `?section=${id}`) }
  const author = (id: string | null) => data?.authors.find(author => author.user_id === id)?.display_name ?? 'Comunidade'
  const contributions = data?.contributions.filter(item => item.section_id === section?.id) ?? []
  const comments = contributions.filter(item=>item.kind==='comment')
  const ranges = section ? commentRanges(mode&&draft?draft:section.content,comments) : []
  function activateComment(id:string) { setActiveComment(id); const mark=Array.from(document.querySelectorAll<HTMLElement>('[data-comment-id]')).find(item=>item.dataset.commentId===id);requestAnimationFrame(()=>mark?.scrollIntoView({block:'start',behavior:'smooth'})) }
  function beginComment(value:CommentSelection) { setComment(value);setActiveComment(null) }
  const statuses = { open: 'Em discussão', accepted: 'Publicada', rejected: 'Não incorporada', resolved: 'Resolvido' }
  function start(action: 'suggest' | 'publish') { if (!section) return; setComment(null);setSelection(null); setDraft(section.content); setBase(section.version); setMode(action); setEditorReady(false); setEditorMentions([]); setNoteMentions([]); setPreservedDraft(null); setNote(''); setLicense(false); setError(''); setMessage('') }
  return <main className="mx-auto min-w-0 w-full max-w-7xl px-4 py-6 sm:px-6">
    <Link href="/community/tools" className="text-sm text-[#625E59] underline">← Ferramentas</Link>
    <div className="mt-4 flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-semibold">{archived ? 'Ciclo contratual · arquivo' : 'Migração de CLM'}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#625E59]">Um caminho para entender seu jurídico, escolher uma solução e fazer a mudança funcionar. Membros propõem melhorias; membros-lead revisam e publicam.</p></div><a className="text-sm underline" href="https://legalops.dev/mapa-contratos/" target="_blank" rel="noreferrer">Ver jornada pública ↗</a></div>
    <p className="mt-3 text-xs text-[#625E59]">{data?.isLead ? 'Você é membro-lead: pode revisar sugestões e publicar alterações.' : 'Comentários e propostas ficam entre membros. O texto aprovado fica público sob licença MIT.'}</p>
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {message && <p role="status" className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-800">{message}</p>}
    {!section ? <div className="mt-6"><p>{error ? 'O mapa não carregou.' : 'Carregando mapa…'}</p><button className={button} onClick={() => load().catch(e => setError(e.message))}>Tentar novamente</button></div> : <>
      {archived ? <p className="mt-5 text-sm">Esta é a estrutura anterior do ciclo contratual, com seu histórico preservado. <button className="font-semibold underline" onClick={() => navigate('contexto')}>Abrir Migração de CLM →</button></p> : <>
        <p className="mt-4 text-sm leading-6 text-[#625E59]">Para o primeiro CLM ou a troca do atual. Comece pelo diagnóstico; aprofunde o que se aplica ao porte, à operação e aos riscos da empresa.</p>
        <nav aria-label="Fases da migração" className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4">{MIGRATION_PHASES.map((item,index) => <button key={item.id} disabled={!!mode || busy} aria-current={phase === item.id ? 'step' : undefined} onClick={() => navigate(MIGRATION_STAGES.find(stage => stage.phase === item.id)!.id)} className={`min-h-16 rounded-xl border p-3 text-left text-sm disabled:opacity-50 ${phase === item.id ? 'border-[#A94E38] bg-[#F6E9E2]' : 'border-[#CEC8BD] bg-white'}`}><span className="mb-1 block text-xs text-[#A94E38]">Fase {index+1}</span><strong>{item.title}</strong></button>)}</nav>
      </>}
      <div className="mt-6 flex flex-wrap items-end gap-3"><label className="min-w-0 flex-1 text-sm font-semibold">Etapa da jornada<select disabled={!!mode || busy} value={section.id} onChange={e => navigate(e.target.value)} className="mt-2 block min-h-12 w-full rounded-xl border border-[#CEC8BD] bg-white px-3">{sections.map((item,index) => <option key={item.id} value={item.id}>{index+1}. {item.title}</option>)}</select></label><button className={button} disabled={busy} onClick={() => load().then(() => setMessage('Mapa atualizado. Rascunhos em edição foram preservados.')).catch(e => setError(e.message))}>Atualizar</button></div>
      <div className="mt-3 flex items-center justify-between gap-2"><button className={button} disabled={!!mode || busy || stageIndex <= 0} onClick={() => navigate(sections[stageIndex-1].id)}>← Anterior</button><span className="text-center text-xs text-[#625E59]">Lendo etapa {stageIndex+1} de {sections.length}</span><button className={button} disabled={!!mode || busy || stageIndex >= sections.length-1} onClick={() => navigate(sections[stageIndex+1].id)}>Próxima →</button></div>
      <nav aria-label="Conteúdo da etapa" className="mt-5 grid grid-cols-3 gap-1 border-b border-[#CEC8BD]">{([['document','Texto aprovado'],['discussion',`Propostas (${contributions.filter(c => c.kind === 'suggestion' && c.status === 'open').length})`],['history','Histórico']] as const).map(([id,title]) => <button key={id} disabled={!!mode} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)} className={`min-h-12 border-b-2 px-2 text-xs font-semibold sm:text-sm ${tab === id ? 'border-[#A94E38] text-[#A94E38]' : 'border-transparent text-[#625E59]'}`}>{title}</button>)}</nav>
      {tab === 'document' && <section className="mt-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">{section.title} <span className="text-xs font-normal text-[#625E59]">· versão {section.version}</span></h2><div className="flex flex-wrap gap-2"><button type="button" className={button} onClick={()=>setActiveComment('all')}>Comentários ({commentThreads(comments).filter(thread=>thread.root.status==='open').length})</button>{!mode&&<><button className={button} onClick={()=>start('suggest')}>Sugerir alteração</button>{data!.isLead&&<button className={`${button} bg-[#24231F] text-white`} onClick={()=>start('publish')}>Editar e publicar</button>}</>}</div></div>
        <div className="map-document-layout"><div className="min-w-0">
          {!mode ? <div>
            <div ref={approvedRef} onKeyDown={event=>{if((event.ctrlKey||event.metaKey)&&event.altKey&&event.key.toLowerCase()==='m'&&selection){event.preventDefault();beginComment(selection)}}} className="rounded-2xl border border-[#CEC8BD] bg-white p-5 sm:p-7"><MapContent content={section.content} ranges={ranges} activeId={activeComment} onActivate={activateComment}/></div>
            <div className="sticky bottom-20 z-10 mt-2 flex flex-wrap items-center gap-3 rounded-xl bg-[#F5F1E8] p-2 sm:bottom-4"><p className="text-xs text-[#625E59]">Selecione um trecho para comentar. Clique no destaque para abrir a conversa.</p>{selection&&<button type="button" className={`${button} bg-white`} onMouseDown={event=>event.preventDefault()} onClick={()=>beginComment(selection)}>Comentar trecho selecionado</button>}</div>
          </div> : <div className="space-y-4">
            <p className="text-sm">{mode==='suggest'?'Proponha uma nova versão desta etapa. O texto atual continua público até a revisão.':'Ao publicar, este texto ficará disponível para qualquer pessoa.'}</p>
            {base!==section.version&&<div role="alert" className="rounded-xl bg-amber-50 p-4 text-sm">Existe uma versão mais recente. Compare abaixo e ajuste seu texto antes de continuar.<details className="my-3"><summary className="cursor-pointer font-semibold">Ver versão {section.version}</summary><MapContent content={section.content}/></details><button type="button" className={button} onClick={()=>{setPreservedDraft(draft);setBase(section.version);setEditorReady(false);setComment(null)}}>Abrir rascunho atualizado e guardar o anterior</button></div>}
            {preservedDraft&&<details className="rounded-xl border border-amber-200 bg-amber-50 p-3"><summary className="cursor-pointer text-sm font-semibold">Seu rascunho anterior preservado</summary><MapContent content={preservedDraft}/></details>}
            <MapEditor content={draft!} sectionId={section.id} version={base} userId={data!.userId} userName={data!.userName??'Membro'} onChange={setDraft} onQuote={beginComment} comments={comments} activeComment={activeComment} onComment={activateComment} onMentions={setEditorMentions} onReady={setEditorReady}/>
            <form onSubmit={event=>{event.preventDefault();send({action:mode,section:section.id,version:base,content:draft,note,license,mentions:Array.from(new Set([...editorMentions,...noteMentions])).slice(0,10)},mode==='publish'?'Nova versão publicada no mapa público.':'Proposta enviada para revisão pelos membros-lead.')}} className="space-y-4">
              <MentionField label="O que mudou e por quê?" value={note} onChange={setNote} onMentions={setNoteMentions} maxLength={mode==='publish'?1000:4000}/>
              <label className="flex items-start gap-2 text-sm"><input className="mt-1" type="checkbox" required checked={license} onChange={event=>setLicense(event.target.checked)}/>Autorizo a publicação sob licença MIT. Não incluí dados confidenciais ou pessoais de terceiros.</label>
              <div className="flex flex-wrap gap-2"><button disabled={busy||!editorReady||base!==section.version} className={`${button} bg-[#24231F] text-white`}>{busy?'Salvando…':mode==='publish'?'Publicar versão':'Enviar proposta'}</button><button disabled={busy} type="button" className={button} onClick={()=>{if(window.confirm(editorReady?'Fechar o editor? O rascunho sincronizado permanece no servidor; a justificativa ainda não enviada será descartada.':'Há alterações que podem não ter sido sincronizadas. Fechar mesmo assim?')){setMode(null);setDraft(null);setNote('');setComment(null)}}}>Cancelar</button></div>
            </form>
          </div>}
        </div><DocumentComments key={section.id} section={section.id} version={mode?base:section.version} comments={comments} ranges={ranges} activeId={activeComment} draft={comment} isLead={data!.isLead} author={author} onActivate={activateComment} onDraft={setComment} onClose={()=>{setActiveComment(null);setComment(null)}} onSent={id=>{setComment(null);if(id)setActiveComment(id);setSelection(null);load().catch(error=>setError(error.message))}} onResolved={()=>{setComment(null);setActiveComment(null);load().catch(error=>setError(error.message))}}/></div>
      </section>}
      {tab === 'discussion' && <section className="mt-5 space-y-4">
        {!contributions.some(item=>item.kind==='suggestion') && <p className="py-4 text-sm text-[#625E59]">Nenhuma proposta nesta etapa ainda. Use “Sugerir alteração” no documento.</p>}
        {contributions.filter(item=>item.kind==='suggestion').map(item => <article key={item.id} id={`contribution-${item.id}`} className="rounded-2xl border border-[#CEC8BD] bg-white p-4 sm:p-5"><div className="flex flex-wrap justify-between gap-2 text-sm"><Link className="font-semibold underline" href={`/community/members/${item.author_id}`}>{author(item.author_id)}</Link><span className="text-xs text-[#625E59]">{item.kind === 'suggestion' ? 'Proposta' : 'Comentário'} · {statuses[item.status]}</span></div>{item.parent_id&&<p className="mt-2 text-xs text-[#625E59]">Em resposta a <a href={`#contribution-${item.parent_id}`} className="underline">{author(contributions.find(parent=>parent.id===item.parent_id)?.author_id??null)}</a></p>}{item.anchor_quote&&<blockquote className="mt-3 border-l-2 border-[#A94E38] pl-3 text-sm text-[#625E59]">“{item.anchor_quote}”<span className="block text-xs">Trecho indicado na construção da versão {item.base_version}</span></blockquote>}<p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">{item.body}</p>{item.kind==='comment'&&<button className={`${button} mt-3`} onClick={()=>setComment({parent:item.id})}>Responder</button>}{item.proposed_content && <details className="mt-3"><summary className="cursor-pointer text-sm font-semibold">Comparar proposta · baseada na versão {item.base_version}</summary><div className="mt-3 grid gap-4 md:grid-cols-2"><div className="min-w-0 rounded-xl bg-[#FAF7F1] p-4"><p className="mb-3 text-xs font-bold">Texto atual · v{section.version}</p><MapContent content={section.content} /></div><div className="min-w-0 rounded-xl border border-[#CEC8BD] p-4"><p className="mb-3 text-xs font-bold">Texto proposto</p><MapContent content={item.proposed_content} /></div></div></details>}{item.review_note && <p className="mt-3 border-l-2 border-[#A94E38] pl-3 text-sm">{author(item.reviewer_id)}: {item.review_note}</p>}
          {data!.isLead && item.status === 'open' && <button disabled={busy} className={`${button} mt-3`} onClick={() => { setReviewing(item); setReviewNote(''); setDecisions(mapChanges(section.content,item.proposed_content??section.content).filter(change=>change.changed).map(()=>null)) }}>Revisar</button>}
          {reviewing?.id === item.id && <div className="mt-3 space-y-3 border-t border-[#CEC8BD] pt-3"><label className="block text-sm">Explique sua decisão<textarea minLength={3} maxLength={1000} value={reviewNote} onChange={e => setReviewNote(e.target.value)} className="mt-2 block w-full rounded-xl border p-3" /></label>{item.kind==='suggestion' && item.proposed_content && item.base_version===section.version && <ChangeReview before={section.content} after={item.proposed_content} decisions={decisions} onChange={setDecisions}/>}
          {item.kind === 'suggestion' && item.base_version !== section.version && <p className="text-sm text-amber-800">A etapa mudou desde esta proposta. Incorpore os pontos úteis em “Editar e publicar” e registre a decisão aqui.</p>}<div className="flex flex-wrap gap-2">{item.kind === 'suggestion' && <button disabled={busy || reviewNote.trim().length < 3 || item.base_version !== section.version || decisions.some(value=>value===null) || !decisions.some(value=>value===true)} className={`${button} bg-[#24231F] text-white`} onClick={() => send({ action: 'accept', id: item.id, section: section.id, version: section.version, content: item.proposed_content, note: reviewNote, decisions }, 'Sugestão aceita e nova versão publicada.')}>Publicar alterações aceitas</button>}<button disabled={busy || reviewNote.trim().length < 3} className={button} onClick={() => send({ action: 'review', id: item.id, status: item.kind === 'comment' ? 'resolved' : 'rejected', note: reviewNote }, 'Decisão registrada.')}>{item.kind === 'comment' ? 'Marcar resolvido' : 'Não incorporar'}</button><button disabled={busy} className={button} onClick={() => setReviewing(null)}>Cancelar</button></div></div>}
        </article>)}<p className="text-xs text-[#625E59]">São exibidas as contribuições mais recentes (até 500 no mapa).</p>
      </section>}
      {tab === 'history' && <section className="mt-5 space-y-3">{data!.revisions.filter(item => item.section_id === section.id).map(item => <details key={item.version} className="rounded-xl border border-[#CEC8BD] bg-white p-4"><summary className="cursor-pointer text-sm"><strong>Versão {item.version}</strong> · {author(item.editor_id)} · {new Date(item.created_at).toLocaleDateString('pt-BR')}<span className="mt-1 block text-[#625E59]">{item.note}</span></summary><div className="mt-4"><MapContent content={item.content} /></div></details>)}<p className="text-xs text-[#625E59]">Últimas 100 revisões do mapa. As anteriores permanecem preservadas.</p></section>}
    </>}
    {!archived && !mode && <details className="mt-8 border-t border-[#CEC8BD] pt-4 text-xs text-[#625E59]"><summary className="cursor-pointer">Sobre esta construção aberta</summary><p className="mt-3 leading-6">Roteiro adaptável, sem nota universal de maturidade. Registre o que não se aplica e proponha variáveis específicas do seu contexto. A jornada evolui com a comunidade.</p><button className="mt-3 min-h-11 underline" onClick={() => navigate('solicitacao')}>Consultar o ciclo contratual anterior e seu histórico</button></details>}
  </main>
}
