'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowUp, Settings2, X } from 'lucide-react'
import { AgentAnswer } from '@/components/community/AgentAnswer'
import { COMMUNITY_CATEGORIES } from '@/lib/community'
import { PRO_DAILY_QUESTIONS } from '@/lib/club-pro'
import type { AgentTurn } from '@/lib/club-personal-agent'

export function PersonalAgent({embedded=false}:{embedded?:boolean}) {
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
  async function load() {
    setLoading(true);setError('')
    try {const response=await fetch('/api/club/agent',{cache:'no-store'});const data=await response.json();if(!response.ok)throw new Error(data.error);setTurns(data.turns);setFocus(data.preferences.focus);setTopics(data.preferences.topics);setUsed(data.used);setPage(0);setHasMore(Boolean(data.has_more));setLoaded(true)}catch(error){setError(error instanceof Error?error.message:'Não conseguimos carregar o agente.')}finally{setLoading(false)}
  }
  useEffect(()=>{void load()},[])
  const lastTurn=turns[turns.length-1]?.id
  useEffect(()=>{if(scroll.current&&(nearBottom.current||pendingQuestion)){scroll.current.scrollTop=scroll.current.scrollHeight;setShowLatest(false)}},[lastTurn,pendingQuestion,loading])
  useEffect(()=>{if(input.current){input.current.style.height='auto';input.current.style.height=Math.min(input.current.scrollHeight,160)+'px'}},[question])
  async function older() {
    if(loadingOlder||sending)return
    setLoadingOlder(true);setError('')
    const height=scroll.current?.scrollHeight??0
    try {const response=await fetch(`/api/club/agent?page=${page+1}`,{cache:'no-store'});const data=await response.json();if(!response.ok)throw new Error(data.error);setTurns(current=>[...data.turns.filter((turn:AgentTurn)=>!current.some(item=>item.id===turn.id)),...current]);setPage(page+1);setHasMore(Boolean(data.has_more));requestAnimationFrame(()=>{if(scroll.current)scroll.current.scrollTop+=scroll.current.scrollHeight-height})}catch{setError('Não conseguimos carregar as mensagens anteriores.')}finally{setLoadingOlder(false)}
  }
  async function ask(event?:React.FormEvent, suggested?:string) {
    event?.preventDefault()
    const text=(suggested??question).trim()
    if(sendingRef.current||loading||!loaded||loadingOlder||text.length<3||used>=PRO_DAILY_QUESTIONS)return
    sendingRef.current=true;setSending(true);setPendingQuestion(text);setQuestion('');setError('');setNotice('')
    try {const response=await fetch('/api/club/agent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:text,page:window.location.pathname})});const data=await response.json();if(!response.ok)throw new Error(data.error);setTurns(current=>[...current,data.turn]);setUsed(current=>current+1)}catch(error){setQuestion(text);setError(error instanceof Error?error.message:'Não conseguimos conectar. Tente novamente.')}finally{sendingRef.current=false;setSending(false);setPendingQuestion('');input.current?.focus()}
  }
  return <section className={`personal-agent ${embedded?'agent-embedded':''} mx-auto flex w-full max-w-5xl flex-col px-4 sm:px-6`} aria-label="Seu agente pessoal">
    <header className="flex shrink-0 items-center justify-between gap-3 py-2"><p className="text-xs text-[#817A73]">Conversa privada · {used}/{PRO_DAILY_QUESTIONS} perguntas hoje</p><button type="button" aria-expanded={settings} aria-controls="agent-settings" onClick={()=>setSettings(value=>!value)} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-[#F5F1E8]" aria-label={settings?'Fechar contexto e preferências':'Contexto e preferências'}>{settings?<X className="h-4 w-4"/>:<Settings2 className="h-4 w-4"/>}</button></header>
    {settings?<section id="agent-settings" className="max-h-[45dvh] shrink-0 overflow-y-auto border-b border-[#CEC8BD] bg-white p-4"><form onSubmit={async event=>{event.preventDefault();setSaving(true);setNotice('');setError('');try{const response=await fetch('/api/club/agent',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({focus,topics})});if(!response.ok)throw new Error();setNotice('Contexto salvo.');setSettings(false)}catch{setError('Não conseguimos salvar seu contexto.')}finally{setSaving(false)}}}><label className="block text-sm font-semibold">Seu foco atual<textarea value={focus} onChange={event=>setFocus(event.target.value)} rows={3} maxLength={2000} placeholder="O que está tentando resolver no trabalho?" className="mt-2 w-full rounded-xl border border-[#CEC8BD] p-3 text-base"/></label><fieldset className="mt-4"><legend className="text-sm font-semibold">Assuntos de interesse</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{Object.entries(COMMUNITY_CATEGORIES).map(([key,category])=><label key={key} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={topics.includes(key)} onChange={event=>setTopics(current=>event.target.checked?[...current,key].slice(0,12):current.filter(value=>value!==key))}/>{category.label}</label>)}</div></fieldset><button disabled={saving||loading} className="mt-4 min-h-12 rounded-xl bg-[#24231F] px-4 text-sm font-semibold text-white disabled:opacity-50">{saving?'Salvando…':'Salvar contexto'}</button></form><p className="mt-4 text-xs leading-6 text-[#625E59]">O histórico fica nesta conversa. A resposta usa o contexto salvo e as oito interações mais recentes. O limite diário renova às 21h de Brasília. WhatsApp não é consultado.</p><details className="mt-4 text-sm"><summary className="min-h-11 cursor-pointer py-2">Gerenciar histórico</summary><p className="mt-2 text-xs leading-6">Apagar remove suas conversas concluídas. Contexto e limite diário são mantidos.</p><button disabled={sending||loading} onClick={async()=>{if(!window.confirm('Apagar seu histórico de conversas?'))return;try{const response=await fetch('/api/club/agent',{method:'DELETE'});if(!response.ok)throw new Error();setTurns([]);setHasMore(false);setPage(0);setNotice('Histórico apagado.')}catch{setError('Não conseguimos apagar o histórico.')}}} className="min-h-11 text-sm text-red-700 underline">Apagar meu histórico</button></details></section>:null}
    <div ref={scroll} onScroll={()=>{const el=scroll.current;if(el){nearBottom.current=el.scrollHeight-el.scrollTop-el.clientHeight<80;setShowLatest(!nearBottom.current)}}} className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-4" aria-label="Histórico da conversa" role="log" aria-live="polite" tabIndex={0}>
      {loading?<p role="status" className="text-sm text-[#625E59]">Carregando sua conversa…</p>:<>
        {hasMore?<div className="mb-6 text-center"><button disabled={loadingOlder||sending} onClick={()=>void older()} className="min-h-11 rounded-xl border border-[#CEC8BD] bg-white px-4 text-sm disabled:opacity-50">{loadingOlder?'Carregando…':'Carregar mensagens anteriores'}</button></div>:null}
        {!turns.length&&!pendingQuestion&&loaded?<div className="mx-auto flex min-h-full max-w-xl flex-col justify-center py-6"><h2 className="text-center text-2xl font-semibold">Como posso ajudar hoje?</h2><p className="mt-3 text-center text-sm leading-6 text-[#625E59]">Seu contexto e suas mensagens continuam aqui.</p><div className="mt-6 grid gap-2">{['Resuma minhas últimas interações no app e as novidades da comunidade.','Quais posts devo acompanhar de acordo com meu perfil?','Há algum Bench ou encontro novo que faça sentido para meu perfil?'].map(example=><button key={example} disabled={sending||loading||!loaded} onClick={()=>void ask(undefined,example)} className="min-h-11 rounded-lg border border-[#E6DED0] bg-white px-3 py-2 text-left text-sm leading-6 hover:bg-[#FAF7F1]">{example}</button>)}</div></div>:null}
        <div className="mx-auto max-w-3xl space-y-8">{turns.map(turn=><div key={turn.id} className="space-y-5"><article aria-label="Sua mensagem" className="ml-auto max-w-[90%] rounded-2xl bg-[#F0EEE8] px-4 py-3 sm:max-w-[80%]"><p className="whitespace-pre-wrap break-words text-base leading-7">{turn.question}</p></article><article aria-label="Resposta do agente" className="pr-2"><AgentAnswer answer={turn.answer ?? 'A resposta desta mensagem não está disponível.'}/>{turn.sources?.length>0?<details className="mt-3 text-sm"><summary className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-[#CEC8BD] bg-white px-4">{turn.sources.length} fontes consultadas</summary><ol className="mt-3 space-y-2">{turn.sources.map((source,index)=><li key={`${source.url}-${index}`}><a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-block min-h-11 break-words py-2 text-sm underline">[{index+1}] {source.title}</a></li>)}</ol></details>:null}</article></div>)}</div>
        {pendingQuestion?<div className="mx-auto mt-8 max-w-3xl space-y-5"><p className="ml-auto max-w-[90%] whitespace-pre-wrap rounded-2xl bg-[#F0EEE8] px-4 py-3 text-base leading-7">{pendingQuestion}</p><p role="status" className="text-sm text-[#625E59]">Pensando na sua mensagem…</p></div>:null}
      </>}
    </div>
    <div className="relative shrink-0 bg-white pb-3 pt-2">
      {showLatest&&<button type="button" aria-label="Ir à última mensagem" onClick={()=>{if(scroll.current)scroll.current.scrollTop=scroll.current.scrollHeight;nearBottom.current=true;setShowLatest(false)}} className="absolute -top-12 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-[#CEC8BD] bg-white shadow-sm"><ArrowDown className="h-4 w-4"/></button>}
      {notice?<p role="status" className="mb-2 text-sm text-green-800">{notice}</p>:null}
      {error?<div role="alert" className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800"><p>{error}</p>{!loaded?<button onClick={()=>void load()} className="min-h-11 underline">Tentar carregar novamente</button>:null}</div>:null}
      <form onSubmit={ask} className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-[#CEC8BD] bg-[#FAF7F1] p-2 focus-within:border-[#817A73]"><label htmlFor="agent-question" className="sr-only">Mensagem para seu agente</label><textarea ref={input} id="agent-question" value={question} onChange={event=>setQuestion(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.nativeEvent.isComposing){event.preventDefault();void ask()}}} disabled={sending} required minLength={3} maxLength={2000} rows={1} placeholder="Pergunte ao seu agente" className="max-h-40 w-full resize-none border-0 bg-transparent px-1 py-2 text-base leading-6 outline-none disabled:opacity-70"/><div className="shrink-0"><button disabled={sending||loading||!loaded||loadingOlder||question.trim().length<3||used>=PRO_DAILY_QUESTIONS} className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full bg-[#24231F] text-white disabled:opacity-40" aria-label="Enviar mensagem"><ArrowUp className="h-5 w-5"/></button></div></form><p className="mx-auto mt-2 max-w-3xl text-center text-[11px] leading-5 text-[#817A73]">{used>=PRO_DAILY_QUESTIONS?'Limite de hoje atingido.':'Confira as fontes. Enter envia · Shift + Enter quebra linha.'}</p>
    </div>
  </section>
}
