'use client'
import { useClubLanguage } from '@/components/community/ClubLanguage'

import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Settings2, X, PanelLeft, Plus } from 'lucide-react'
import { AgentConversations, type AgentConversation } from '@/components/community/AgentConversations'
import { AgentAnswer } from '@/components/community/AgentAnswer'
import { COMMUNITY_CATEGORIES } from '@/lib/community'
import { PRO_DAILY_QUESTIONS } from '@/lib/club-pro'
import type { AgentTurn } from '@/lib/club-personal-agent'

export function PersonalAgent({embedded=false}:{embedded?:boolean}) {
 const { t } = useClubLanguage()

  const [conversations,setConversations]=useState<AgentConversation[]>([])
  const [conversationId,setConversationId]=useState<string|null>(null)
  const [historyOpen,setHistoryOpen]=useState(false)
  const [hasMoreConversations,setHasMoreConversations]=useState(false)
  const [conversationPage,setConversationPage]=useState(0)
  const [loadingConversations,setLoadingConversations]=useState(false)
  const [managing,setManaging]=useState(false)
  const [deleteCandidate,setDeleteCandidate]=useState<AgentConversation|null>(null)
  const drafts=useRef<Record<string,string>>({})
  const loadVersion=useRef(0)
  const managementRef=useRef(false)
  const [turns,setTurns]=useState<AgentTurn[]>([])
  const [question,setQuestion]=useState('')
  const [pendingQuestion,setPendingQuestion]=useState('')
  const [focus,setFocus]=useState('')
  const [topics,setTopics]=useState<string[]>([])
  const [used,setUsed]=useState(0)
  const [loading,setLoading]=useState(true)
  const [loaded,setLoaded]=useState(false)
  const [sending,setSending]=useState(false)
  const [saving,setSaving]=useState(false)
  const [loadingOlder,setLoadingOlder]=useState(false)
  const [hasMore,setHasMore]=useState(false)
  const [page,setPage]=useState(0)
  const [settings,setSettings]=useState(false)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const [showLatest,setShowLatest]=useState(false)
  const nearBottom=useRef(true)
  const scroll=useRef<HTMLDivElement>(null)
  const input=useRef<HTMLTextAreaElement>(null)
  const sendingRef=useRef(false)
  async function load(id?:string, replaceList=false) {
    const version=++loadVersion.current
    setLoading(true);setLoaded(false);setError('');setTurns([]);setHasMore(false)
    setConversationId(id??null);setQuestion(drafts.current[id??'new']??'')
    try {
      const response=await fetch('/api/club/agent'+(id?`?conversation_id=${id}`:''),{cache:'no-store'})
      const data=await response.json();if(!response.ok)throw new Error(data.error)
      if(version!==loadVersion.current)return
      const selected=data.conversation_id??null
      setConversationId(selected);setTurns(data.turns);setQuestion(drafts.current[selected??'new']??'')
      setFocus(data.preferences.focus);setTopics(data.preferences.topics);setUsed(data.used);setPage(0);setHasMore(Boolean(data.has_more));setLoaded(true)
      if(replaceList||!id){setConversations(data.conversations??[]);setHasMoreConversations(Boolean(data.has_more_conversations));setConversationPage(0)}
      nearBottom.current=true
    }catch(error){if(version===loadVersion.current)setError(error instanceof Error?error.message:t("Não conseguimos carregar o agente."))}
    finally{if(version===loadVersion.current)setLoading(false)}
  }
  useEffect(()=>{void load();return()=>{loadVersion.current++}},[])
  const lastTurn=turns[turns.length-1]?.id
  useEffect(()=>{if(scroll.current&&(nearBottom.current||pendingQuestion)){scroll.current.scrollTop=scroll.current.scrollHeight;setShowLatest(false)}},[lastTurn,pendingQuestion,loading])
  useEffect(()=>{if(input.current){input.current.style.height='auto';input.current.style.height=Math.min(input.current.scrollHeight,160)+'px'}},[question])
  const blocked=sending||loading||loadingOlder||managing||loadingConversations
  function selectConversation(id:string) {
    if(blocked||sendingRef.current||managementRef.current)return
    drafts.current[conversationId??'new']=question
    setNotice('');setDeleteCandidate(null)
    if(window.innerWidth<768)setHistoryOpen(false)
    void load(id)
  }
  async function newConversation() {
    if(blocked||sendingRef.current||managementRef.current)return
    managementRef.current=true;setManaging(true);setError('');setNotice('')
    drafts.current[conversationId??'new']=question
    try {
      const response=await fetch('/api/club/agent/conversations',{method:'POST'})
      const data=await response.json();if(!response.ok)throw new Error(data.error)
      setConversations(current=>[data.conversation,...current.filter(item=>item.id!==data.conversation.id)]);setDeleteCandidate(null)
      if(window.innerWidth<768)setHistoryOpen(false)
      await load(data.conversation.id,true)
      input.current?.focus()
    }catch(error){setError(error instanceof Error?error.message:t('Não conseguimos criar a conversa.'))}
    finally{managementRef.current=false;setManaging(false)}
  }
  async function deleteConversation() {
    if(!deleteCandidate||blocked||managementRef.current)return
    const target=deleteCandidate
    managementRef.current=true;setManaging(true);setError('')
    try {
      const response=await fetch(`/api/club/agent?conversation_id=${target.id}`,{method:'DELETE'})
      const data=await response.json();if(!response.ok)throw new Error(data.error)
      delete drafts.current[target.id]
      setConversations(current=>current.filter(item=>item.id!==target.id));setDeleteCandidate(null)
      if(target.id===conversationId){setQuestion('');await load(undefined,true)}
      else {
        const listResponse=await fetch('/api/club/agent/conversations',{cache:'no-store'})
        if(listResponse.ok){const list=await listResponse.json();setConversations(list.conversations);setConversationPage(0);setHasMoreConversations(Boolean(list.has_more))}
      }
      setNotice(t('Conversa apagada.'))
    }catch(error){setError(error instanceof Error?error.message:t('Não conseguimos apagar a conversa.'))}
    finally{managementRef.current=false;setManaging(false)}
  }
  async function moreConversations() {
    if(blocked)return
    setLoadingConversations(true)
    try {
      const response=await fetch(`/api/club/agent/conversations?page=${conversationPage+1}`,{cache:'no-store'})
      const data=await response.json();if(!response.ok)throw new Error(data.error)
      setConversations(current=>[...current,...data.conversations.filter((item:AgentConversation)=>!current.some(existing=>existing.id===item.id))])
      setConversationPage(conversationPage+1);setHasMoreConversations(Boolean(data.has_more))
    }catch{setError(t('Não conseguimos carregar as conversas.'))}finally{setLoadingConversations(false)}
  }
  async function older() {
    if(blocked||!conversationId)return
    setLoadingOlder(true);setError('')
    const version=loadVersion.current
    const height=scroll.current?.scrollHeight??0
    try {const response=await fetch(`/api/club/agent?conversation_id=${conversationId}&page=${page+1}`,{cache:'no-store'});const data=await response.json();if(!response.ok)throw new Error(data.error);if(version!==loadVersion.current)return;setTurns(current=>[...data.turns.filter((turn:AgentTurn)=>!current.some(item=>item.id===turn.id)),...current]);setPage(page+1);setHasMore(Boolean(data.has_more));requestAnimationFrame(()=>{if(scroll.current&&version===loadVersion.current)scroll.current.scrollTop+=scroll.current.scrollHeight-height})}catch{setError(t("Não conseguimos carregar as mensagens anteriores."))}finally{setLoadingOlder(false)}
  }
  async function ask(event?:React.FormEvent, suggested?:string) {
    event?.preventDefault()
    const text=(suggested??question).trim()
    if(sendingRef.current||managementRef.current||blocked||!loaded||text.length<3||used>=PRO_DAILY_QUESTIONS)return
    sendingRef.current=true;setSending(true);setPendingQuestion(text);setQuestion('');setError('');setNotice('')
    let selected=conversationId
    try {
      const response=await fetch('/api/club/agent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:text,page:window.location.pathname,conversation_id:conversationId})})
      const data=await response.json()
      if(data.conversation_id){selected=data.conversation_id;setConversationId(selected);setConversations(current=>current.some(item=>item.id===selected)?current:[{id:selected!,title:text.slice(0,80),created_at:new Date().toISOString(),updated_at:new Date().toISOString()},...current])}
      if(!response.ok)throw new Error(data.error)
      setTurns(current=>[...current,data.turn]);setUsed(current=>current+1)
      drafts.current[selected??'new']=''
      if(!conversationId)delete drafts.current.new
      const now=new Date().toISOString()
      setConversations(current=>{
        const existing=current.find(item=>item.id===selected)
        return [{id:selected!,title:existing?.title==='Nova conversa'||!existing?text.slice(0,80):existing.title,created_at:existing?.created_at??now,updated_at:now},...current.filter(item=>item.id!==selected)]
      })
    }catch(error){drafts.current[selected??'new']=text;setQuestion(text);setError(error instanceof Error?error.message:t("Não conseguimos conectar. Tente novamente."))}
    finally{sendingRef.current=false;setSending(false);setPendingQuestion('');input.current?.focus()}
  }
  return <section className={`personal-agent ${embedded?'agent-embedded':''} mx-auto flex w-full max-w-5xl flex-col px-4 sm:px-6`} aria-label={t("Seu agente pessoal")}>
    <header className="flex shrink-0 items-center justify-between gap-2 py-2">
      <div className="flex min-w-0 items-center gap-1"><button type="button" aria-expanded={historyOpen} aria-controls="agent-conversations" onClick={()=>setHistoryOpen(value=>!value)} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-[#F5F1E8]" aria-label={t('Suas conversas')}><PanelLeft className="h-4 w-4"/></button><div className="min-w-0"><p className="truncate text-sm font-semibold">{t(conversations.find(item=>item.id===conversationId)?.title??'Nova conversa')}</p><p className="text-[11px] text-[#817A73]">{t('Conversa privada · {used}/{limit} perguntas hoje', { used, limit: PRO_DAILY_QUESTIONS })}</p></div></div>
      <div className="flex shrink-0 items-center"><button type="button" disabled={blocked} onClick={()=>void newConversation()} className="flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-lg px-2 text-sm hover:bg-[#F5F1E8] disabled:opacity-40" aria-label={t('Nova conversa')}><Plus className="h-4 w-4"/><span className="hidden sm:inline">{t('Nova conversa')}</span></button><button type="button" aria-expanded={settings} aria-controls="agent-settings" onClick={()=>setSettings(value=>!value)} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-[#F5F1E8]" aria-label={settings?t("Fechar contexto e preferências"):t("Contexto e preferências")}>{settings?<X className="h-4 w-4"/>:<Settings2 className="h-4 w-4"/>}</button></div>
    </header>
    {deleteCandidate?<div role="alertdialog" aria-label={t('Apagar conversa')} className="shrink-0 rounded-xl border border-red-200 bg-red-50 p-3 text-sm"><p className="break-words">{t('Apagar “{title}” e suas mensagens?',{title:t(deleteCandidate.title)})}</p><div className="mt-2 flex gap-3"><button disabled={managing} onClick={()=>setDeleteCandidate(null)} className="min-h-11 rounded-lg px-3 underline">{t('Cancelar')}</button><button disabled={blocked} onClick={()=>void deleteConversation()} className="min-h-11 rounded-lg bg-red-700 px-4 font-semibold text-white disabled:opacity-50">{managing?t('Apagando…'):t('Apagar conversa')}</button></div></div>:null}
    <div className="relative flex min-h-0 flex-1">
    {historyOpen?<AgentConversations conversations={conversations} selected={conversationId} disabled={blocked} hasMore={hasMoreConversations} loadingMore={loadingConversations} onSelect={selectConversation} onDelete={item=>{setDeleteCandidate(item);setHistoryOpen(false)}} onMore={()=>void moreConversations()} onClose={()=>setHistoryOpen(false)}/>:null}
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
    {settings?<section id="agent-settings" className="max-h-[45dvh] shrink-0 overflow-y-auto border-b border-[#CEC8BD] bg-white p-4"><form onSubmit={async event=>{event.preventDefault();setSaving(true);setNotice('');setError('');try{const response=await fetch('/api/club/agent',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({focus,topics})});if(!response.ok)throw new Error();setNotice(t("Contexto salvo."));setSettings(false)}catch{setError(t("Não conseguimos salvar seu contexto."))}finally{setSaving(false)}}}><label className="block text-sm font-semibold">{t("Seu foco atual")}<textarea value={focus} onChange={event=>setFocus(event.target.value)} rows={3} maxLength={2000} placeholder={t("O que está tentando resolver no trabalho?")} className="mt-2 w-full rounded-xl border border-[#CEC8BD] p-3 text-base"/></label><fieldset className="mt-4"><legend className="text-sm font-semibold">{t("Assuntos de interesse")}</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{Object.entries(COMMUNITY_CATEGORIES).map(([key,category])=><label key={key} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={topics.includes(key)} onChange={event=>setTopics(current=>event.target.checked?[...current,key].slice(0,12):current.filter(value=>value!==key))}/>{t(category.label)}</label>)}</div></fieldset><button disabled={saving||loading} className="mt-4 min-h-12 rounded-xl bg-[#24231F] px-4 text-sm font-semibold text-white disabled:opacity-50">{saving?t("Salvando…"):t("Salvar contexto")}</button></form><p className="mt-4 text-xs leading-6 text-[#625E59]">{t("Cada conversa tem seu próprio histórico. Seu contexto salvo vale para todas. O limite diário é compartilhado e renova às 21h de Brasília.")}</p></section>:null}
    <div ref={scroll} onScroll={()=>{const el=scroll.current;if(el){nearBottom.current=el.scrollHeight-el.scrollTop-el.clientHeight<80;setShowLatest(!nearBottom.current)}}} className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-4" aria-label={t("Histórico da conversa")} role="log" aria-live="polite" tabIndex={0}>
      {loading?<p role="status" className="text-sm text-[#625E59]">{t("Carregando sua conversa…")}</p>:<>
        {hasMore?<div className="mb-6 text-center"><button disabled={loadingOlder||sending} onClick={()=>void older()} className="min-h-11 rounded-xl border border-[#CEC8BD] bg-white px-4 text-sm disabled:opacity-50">{loadingOlder?t("Carregando…"):t("Carregar mensagens anteriores")}</button></div>:null}
        {!turns.length&&!pendingQuestion&&loaded?<div className="mx-auto flex min-h-full max-w-xl flex-col justify-center py-6"><h2 className="text-center text-2xl font-semibold">{t("Como posso ajudar hoje?")}</h2><p className="mt-3 text-center text-sm leading-6 text-[#625E59]">{t("Comece um assunto aqui ou abra outra conversa na lista.")}</p><div className="mt-6 grid gap-2">{[t("Resuma minhas últimas interações no app e as novidades da comunidade."),t("Quais posts devo acompanhar de acordo com meu perfil?"),t("Há algum Bench ou encontro novo que faça sentido para meu perfil?")].map(example=><button key={example} disabled={sending||loading||!loaded} onClick={()=>void ask(undefined,example)} className="min-h-11 rounded-lg border border-[#E6DED0] bg-white px-3 py-2 text-left text-sm leading-6 hover:bg-[#FAF7F1]">{example}</button>)}</div></div>:null}
        <div className="mx-auto max-w-3xl space-y-8">{turns.map(turn=><div key={turn.id} className="space-y-5"><article aria-label={t("Sua mensagem")} className="ml-auto max-w-[90%] rounded-2xl bg-[#F0EEE8] px-4 py-3 sm:max-w-[80%]"><p className="whitespace-pre-wrap break-words text-base leading-7">{turn.question}</p></article><article aria-label={t("Resposta do agente")} className="pr-2"><AgentAnswer answer={turn.answer ?? t("A resposta desta mensagem não está disponível.")}/>{turn.sources?.length>0?<details className="mt-3 text-sm"><summary className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-[#CEC8BD] bg-white px-4">{t('{count} fontes consultadas', { count: turn.sources.length })}</summary><ol className="mt-3 space-y-2">{turn.sources.map((source,index)=><li key={`${source.url}-${index}`}><a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-block min-h-11 break-words py-2 text-sm underline">[{index+1}] {source.title}</a></li>)}</ol></details>:null}</article></div>)}</div>
        {pendingQuestion?<div className="mx-auto mt-8 max-w-3xl space-y-5"><p className="ml-auto max-w-[90%] whitespace-pre-wrap rounded-2xl bg-[#F0EEE8] px-4 py-3 text-base leading-7">{pendingQuestion}</p><p role="status" className="text-sm text-[#625E59]">{t("Pensando na sua mensagem…")}</p></div>:null}
      </>}
    </div>
    <div className="relative shrink-0 bg-white pb-3 pt-2">
      {showLatest&&<button type="button" aria-label={t("Ir à última mensagem")} onClick={()=>{if(scroll.current)scroll.current.scrollTop=scroll.current.scrollHeight;nearBottom.current=true;setShowLatest(false)}} className="absolute -top-12 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-[#CEC8BD] bg-white shadow-sm"><ArrowDown className="h-4 w-4"/></button>}
      {notice?<p role="status" className="mb-2 text-sm text-green-800">{notice}</p>:null}
      {error?<div role="alert" className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800"><p>{error}</p>{!loaded?<button onClick={()=>void load(conversationId??undefined)} className="min-h-11 underline">{t("Tentar carregar novamente")}</button>:null}</div>:null}
      <form onSubmit={ask} className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-[#CEC8BD] bg-[#FAF7F1] p-2 focus-within:border-[#817A73]"><label htmlFor="agent-question" className="sr-only">{t("Mensagem para seu agente")}</label><textarea ref={input} id="agent-question" value={question} onChange={event=>setQuestion(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.nativeEvent.isComposing){event.preventDefault();void ask()}}} disabled={blocked||!loaded} required minLength={3} maxLength={2000} rows={1} placeholder={t("Pergunte ao seu agente")} className="max-h-40 w-full resize-none border-0 bg-transparent px-1 py-2 text-base leading-6 outline-none disabled:opacity-70"/><div className="shrink-0"><button disabled={blocked||!loaded||question.trim().length<3||used>=PRO_DAILY_QUESTIONS} className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full bg-[#24231F] text-white disabled:opacity-40" aria-label={t("Enviar mensagem")}><ArrowUp className="h-5 w-5"/></button></div></form><p className="mx-auto mt-2 max-w-3xl text-center text-[11px] leading-5 text-[#817A73]">{used>=PRO_DAILY_QUESTIONS?t("Limite de hoje atingido."):t("Confira as fontes. Enter envia · Shift + Enter quebra linha.")}</p>
    </div>
    </div>
    </div>
  </section>
}
