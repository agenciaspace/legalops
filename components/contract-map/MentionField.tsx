'use client'
import { useEffect, useRef, useState } from 'react'
export type MentionMember = {user_id:string;display_name:string}
export function MentionField({value,onChange,onMentions,label,maxLength=4000}: {value:string;onChange:(value:string)=>void;onMentions:(ids:string[])=>void;label:string;maxLength?:number}) {
 const [members,setMembers]=useState<MentionMember[]>([])
 const [selected,setSelected]=useState<MentionMember[]>([])
 const [cursor,setCursor]=useState(0)
 const field=useRef<HTMLTextAreaElement>(null)
 const query=/@([^@\n]{0,50})$/.exec(value.slice(0,cursor))
 useEffect(()=>{if(!value){setSelected([]);onMentions([])}},[value]) // IDs reset with the submitted composer.
 useEffect(()=>{if(!query){setMembers([]);return}const abort=new AbortController();const timer=setTimeout(()=>fetch(`/api/community/contract-map/members?q=${encodeURIComponent(query[1])}`,{signal:abort.signal}).then(r=>r.json()).then(d=>setMembers(d.members??[])).catch(()=>{}),200);return()=>{clearTimeout(timer);abort.abort()}},[query?.[1]])
 function choose(member:MentionMember){const start=cursor-(query?.[0].length??0);const name=`@${member.display_name} `;const next=value.slice(0,start)+name+value.slice(cursor);onChange(next);const mentions=[...selected.filter(item=>item.user_id!==member.user_id),member].slice(-10);setSelected(mentions);onMentions(mentions.map(item=>item.user_id));setMembers([]);setCursor(start+name.length);field.current?.focus()}
 return <div><label className="block text-sm font-semibold">{label}<textarea ref={field} required minLength={3} maxLength={maxLength} value={value} onChange={e=>{onChange(e.target.value);setCursor(e.target.selectionStart)}} onSelect={e=>setCursor(e.currentTarget.selectionStart)} placeholder="Escreva e use @ para mencionar alguém" className="mt-2 block min-h-24 w-full rounded-xl border border-[#CEC8BD] p-3 font-normal"/></label>{query&&members.length>0&&<div role="group" aria-label="Membros para mencionar" className="mt-1 max-h-48 overflow-y-auto rounded-xl border bg-white p-1 shadow-sm">{members.map(member=><button key={member.user_id} type="button" onClick={()=>choose(member)} className="block min-h-11 w-full rounded-lg px-3 text-left text-sm hover:bg-[#F5F1E8]">@{member.display_name}</button>)}</div>}{selected.length>0&&<p className="mt-2 text-xs text-[#625E59]">Notificar: {selected.map(member=>member.display_name).join(', ')} <button type="button" className="underline" onClick={()=>{setSelected([]);onMentions([])}}>Limpar</button></p>}</div>
}
