'use client'
import {useEffect,useRef,useState} from 'react'
import {usePathname,useSearchParams} from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {Maximize2,Minimize2,MessageCircle,X} from 'lucide-react'
const PersonalAgent=dynamic(()=>import('@/app/(main)/community/assistant/PersonalAgent').then(m=>m.PersonalAgent),{loading:()=> <p className="p-5">Carregando sua conversa…</p>})
export function AgentBubble({hasPro}:{hasPro:boolean}){
 const query=useSearchParams();const path=usePathname();const [open,setOpen]=useState(false);const [started,setStarted]=useState(false)
 const trigger=useRef<HTMLButtonElement>(null);const dialog=useRef<HTMLDivElement>(null);const close=useRef<HTMLButtonElement>(null)
 const [expanded,setExpanded]=useState(true)
 const [viewport,setViewport]=useState<{top:number;height:number}|null>(null)
 useEffect(()=>{
  if(!open)return
  const visual=window.visualViewport
  const update=()=>setViewport(window.innerWidth<640&&visual?{top:visual.offsetTop,height:visual.height}:null)
  update();visual?.addEventListener('resize',update);visual?.addEventListener('scroll',update);window.addEventListener('resize',update)
  return()=>{visual?.removeEventListener('resize',update);visual?.removeEventListener('scroll',update);window.removeEventListener('resize',update)}
 },[open])
 useEffect(()=>{if(query.get('agente')==='1'){setStarted(true);setOpen(true)}},[query])
 function dismiss(){setOpen(false);if(query.has('agente')){const next=new URLSearchParams(query);next.delete('agente');history.replaceState(null,'',path+(next.size?'?'+next:''))}trigger.current?.focus()}
 useEffect(()=>{if(!open)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';close.current?.focus();const keyboard=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();close.current?.click()}if(event.key==='Tab'){const nodes=Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],textarea:not([disabled]),input:not([disabled]),select:not([disabled]),summary,[tabindex="0"]')??[]).filter(n=>n.getClientRects().length);const first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}}};document.addEventListener('keydown',keyboard);return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',keyboard)}},[open])
 return <><button ref={trigger} type="button" onClick={()=>{setStarted(true);setOpen(true)}} aria-label="Abrir meu agente" aria-expanded={open} aria-controls="personal-agent-dialog" className="agent-bubble fixed right-4 z-40 flex min-h-14 items-center gap-2 rounded-full bg-[#24231F] px-5 text-sm font-semibold text-white shadow-lg"><MessageCircle className="h-5 w-5"/>Meu agente</button>
 {started?<div hidden={!open} style={viewport?{top:viewport.top,height:viewport.height,bottom:'auto'}:undefined} className="agent-overlay fixed inset-0 z-[70] bg-black/25" onClick={dismiss}><div ref={dialog} id="personal-agent-dialog" role="dialog" aria-modal="true" aria-label="Meu agente" className={`agent-dialog absolute inset-0 flex flex-col bg-white sm:inset-auto sm:bottom-4 sm:right-4 sm:rounded-2xl sm:border sm:border-[#CEC8BD] sm:shadow-xl ${expanded?'sm:h-[min(900px,94dvh)] sm:w-[min(960px,calc(100vw-2rem))]':'sm:h-[min(780px,90dvh)] sm:w-[min(560px,calc(100vw-2rem))]'}`} onClick={e=>e.stopPropagation()}><div className="flex shrink-0 items-center justify-between border-b border-[#E6DED0] px-4 pt-[env(safe-area-inset-top)]"><span className="text-sm font-semibold">Meu agente</span><div className="flex items-center"><button type="button" onClick={()=>setExpanded(value=>!value)} aria-label={expanded?'Reduzir conversa':'Ampliar conversa'} className="hidden min-h-12 min-w-12 items-center justify-center sm:flex">{expanded?<Minimize2 className="h-4 w-4"/>:<Maximize2 className="h-4 w-4"/>}</button><button ref={close} type="button" onClick={dismiss} className="flex min-h-12 min-w-12 items-center justify-center" aria-label="Fechar agente"><X className="h-5 w-5"/></button></div></div>{hasPro?<PersonalAgent embedded/>:<div className="p-6"><h2 className="text-xl font-semibold">Uma conversa para seus assuntos.</h2><p className="mt-3 text-sm leading-7">Resuma suas interações, descubra posts para acompanhar e encontre Bench relacionado ao seu perfil. O agente pessoal faz parte do Pro.</p><Link href="/club/checkout" className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-[#24231F] px-4 text-sm font-semibold text-white">Consultar disponibilidade</Link></div>}</div></div>:null}</>
}
