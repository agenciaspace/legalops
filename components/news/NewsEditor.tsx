'use client'

import { useEffect, useState } from 'react'
import { NEWS_AUDIENCES, NEWS_TOPICS, type NewsArticle, type NewsAudience, type NewsTopic } from '@/lib/news'

type Candidate = { id: string; title: string; url: string; excerpt: string; source_name: string }
type Draft = { id?: string; slug: string; title: string; summary: string; body: string; audiences: NewsAudience[]; topics: NewsTopic[]; impact: Partial<Record<NewsAudience,string>>; sources: { title: string; url: string }[]; status: 'draft' | 'published'; event_date: string; featured: boolean }
const empty = (): Draft => ({ slug: '', title: '', summary: '', body: '', audiences: [], topics: [], impact: {}, sources: [], status: 'draft', event_date: '', featured: false })
export function NewsEditor() {
  const [articles,setArticles] = useState<NewsArticle[]>([])
  const [candidates,setCandidates] = useState<Candidate[]>([])
  const [draft,setDraft] = useState<Draft>(empty)
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')
  const [message,setMessage] = useState('')
  const [pending,setPending] = useState(0)
  async function reload(signal?: AbortSignal) {
    const response = await fetch('/api/news/admin', { signal })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error)
    setArticles(result.articles);setCandidates(result.candidates);setPending(result.pendingSubscriptions)
  }
  useEffect(() => { const controller = new AbortController(); reload(controller.signal).catch(cause => { if (!controller.signal.aborted) setError(cause.message) }); return () => controller.abort() }, [])
  const fieldClass = 'mt-2 min-h-11 w-full rounded-lg border border-[#CEC8BD] bg-white px-3 py-2 text-sm'
  return <div>
    <p className="my-4 text-sm text-[#69635E]">{pending} inscrições aguardando envio ao beehiiv. A coleta diária traz pautas para revisão; publicar disponibiliza a mesma matéria no News e no Club.</p>
    <div className="grid gap-6 xl:grid-cols-[270px_minmax(0,1fr)]"><aside className="min-w-0"><button onClick={() => { setDraft(empty());setMessage('') }} className="min-h-11 rounded-lg bg-[#24231F] px-4 text-sm font-semibold text-white">Nova matéria</button><h2 className="mt-6 text-lg font-semibold">Matérias</h2><div className="mt-3 divide-y divide-[#CEC8BD]">{articles.map(article => <button key={article.id} className="block w-full py-3 text-left text-sm leading-6" onClick={() => {setDraft({...article,event_date:article.event_date??''});setMessage('')}}><span className="block text-xs text-[#A94E38]">{article.status === 'published' ? 'Publicada' : 'Rascunho'}</span>{article.title}</button>)}</div><h2 className="mt-6 text-lg font-semibold">Pautas encontradas</h2>{!candidates.length && <p className="mt-3 text-sm">Nenhuma pauta pendente.</p>}{candidates.map(candidate => <div key={candidate.id} className="border-b border-[#CEC8BD] py-3 text-sm"><a href={candidate.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline">{candidate.title} ↗</a><p className="mt-2 text-xs leading-5 text-[#69635E]">{candidate.excerpt}</p><button className="mt-2 min-h-11 text-xs font-semibold text-[#A94E38]" onClick={() => setDraft({...empty(),title:candidate.title.slice(0,200),sources:[{title:candidate.source_name,url:candidate.url}]})}>Preparar matéria →</button><button className="min-h-11 px-3 text-xs" onClick={async()=>{const response=await fetch('/api/news/admin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'dismiss_candidate',id:candidate.id})});if(response.ok)setCandidates(previous=>previous.filter(item=>item.id!==candidate.id));else setError('Não conseguimos arquivar a pauta.')}}>Arquivar</button></div>)}</aside>
    <form className="min-w-0 space-y-5 rounded-lg border border-[#CEC8BD] bg-[#FAF7F1] p-5" onSubmit={async event => {
      event.preventDefault();setBusy(true);setError('');setMessage('')
      try {const response=await fetch('/api/news/admin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(draft)});const result=await response.json();if(!response.ok)throw new Error(result.error);setDraft(previous=>({...previous,id:result.article.id}));setMessage(result.status==='published'?'Matéria publicada no News e no Club.':'Rascunho salvo.');await reload() }catch(cause){setError(cause instanceof Error?cause.message:'Tente novamente.')}finally{setBusy(false)}
    }}>
      <h2 className="text-xl font-semibold">{draft.id?'Editar matéria':'Nova matéria'}</h2>
      <label className="block text-sm">Título<input className={fieldClass} required minLength={10} maxLength={200} value={draft.title} onChange={event=>setDraft(previous=>({...previous,title:event.target.value}))}/></label>
      <label className="block text-sm">Endereço da matéria<input className={fieldClass} required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={140} placeholder="exemplo-de-noticia" value={draft.slug} onChange={event=>setDraft(previous=>({...previous,slug:event.target.value}))}/></label>
      <label className="block text-sm">Resumo<textarea className={fieldClass} required minLength={30} maxLength={600} rows={3} value={draft.summary} onChange={event=>setDraft(previous=>({...previous,summary:event.target.value}))}/></label>
      <label className="block text-sm">Texto (Markdown)<textarea className={fieldClass} required minLength={80} maxLength={30000} rows={14} value={draft.body} onChange={event=>setDraft(previous=>({...previous,body:event.target.value}))}/></label>
      <fieldset><legend className="text-sm font-semibold">Públicos e impactos</legend>{Object.entries(NEWS_AUDIENCES).map(([key,value])=><div key={key} className="mt-3"><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={draft.audiences.includes(key as NewsAudience)} onChange={event=>setDraft(previous=>({...previous,audiences:event.target.checked?[...previous.audiences,key as NewsAudience]:previous.audiences.filter(item=>item!==key)}))}/>{value.label}</label>{draft.audiences.includes(key as NewsAudience)&&<label className="block text-xs">Impacto para {value.label.toLowerCase()}<textarea className={fieldClass} required minLength={20} maxLength={2000} rows={3} value={draft.impact[key as NewsAudience]??''} onChange={event=>setDraft(previous=>({...previous,impact:{...previous.impact,[key]:event.target.value}}))}/></label>}</div>)}</fieldset>
      <fieldset><legend className="text-sm font-semibold">Assuntos</legend><div className="flex flex-wrap gap-x-5">{Object.entries(NEWS_TOPICS).map(([key,value])=><label key={key} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={draft.topics.includes(key as NewsTopic)} onChange={event=>setDraft(previous=>({...previous,topics:event.target.checked?[...previous.topics,key as NewsTopic]:previous.topics.filter(item=>item!==key)}))}/>{value}</label>)}</div></fieldset>
      <fieldset><legend className="text-sm font-semibold">Fontes</legend>{draft.sources.map((source,index)=><div className="mt-3 grid gap-2 sm:grid-cols-2" key={index}><label className="text-xs">Nome da fonte<input className={fieldClass} required maxLength={200} value={source.title} onChange={event=>setDraft(previous=>({...previous,sources:previous.sources.map((item,i)=>i===index?{...item,title:event.target.value}:item)}))}/></label><label className="text-xs">URL HTTPS<input className={fieldClass} required type="url" pattern="https://.*" value={source.url} onChange={event=>setDraft(previous=>({...previous,sources:previous.sources.map((item,i)=>i===index?{...item,url:event.target.value}:item)}))}/></label><button type="button" className="min-h-11 text-left text-xs underline" onClick={()=>setDraft(previous=>({...previous,sources:previous.sources.filter((_,i)=>i!==index)}))}>Remover fonte</button></div>)}<button type="button" className="mt-3 min-h-11 text-sm font-semibold" disabled={draft.sources.length>=10} onClick={()=>setDraft(previous=>({...previous,sources:[...previous.sources,{title:'',url:''}]}))}>＋ Adicionar fonte</button></fieldset>
      <label className="block text-sm">Data do fato<input type="date" className={fieldClass} value={draft.event_date} onChange={event=>setDraft(previous=>({...previous,event_date:event.target.value}))}/></label>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={draft.featured} onChange={event=>setDraft(previous=>({...previous,featured:event.target.checked}))}/>Destaque da home</label>
      <label className="block text-sm">Publicação<select className={fieldClass} value={draft.status} onChange={event=>setDraft(previous=>({...previous,status:event.target.value as Draft['status']}))}><option value="draft">Rascunho privado</option><option value="published">Publicar no News e no Club</option></select></label>
      <button disabled={busy} className="min-h-11 rounded-lg bg-[#24231F] px-5 text-sm font-semibold text-white disabled:opacity-50">{busy?'Salvando…':draft.status==='published'?'Salvar e publicar':'Salvar rascunho'}</button>
      {message&&<p role="status" className="text-sm text-green-800">{message}</p>}{error&&<p role="alert" className="text-sm text-red-800">{error}</p>}
    </form></div>
    {error && !draft.title && <p role="alert" className="mt-4 text-sm text-red-800">{error}</p>}
  </div>
}
