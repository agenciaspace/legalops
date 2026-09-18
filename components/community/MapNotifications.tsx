'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
type Notice={id:string;section_id:string;contribution_id:string;preview:string}
export function MapNotifications(){
 const [items,setItems]=useState<Notice[]>([])
 useEffect(()=>{let alive=true;const load=()=>fetch('/api/community/contract-map/notifications',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(d=>{if(alive&&d)setItems(d.notifications??[])}).catch(()=>{});load();const timer=setInterval(load,45000);return()=>{alive=false;clearInterval(timer)}},[])
 async function read(id:string){const response=await fetch('/api/community/contract-map/notifications',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});if(response.ok)setItems(items=>items.filter(item=>item.id!==id))}
 return <details className="relative"><summary aria-label={`Menções em documentos${items.length?`: ${items.length} novas`:''}`} className="relative flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full hover:bg-white"><Bell className="h-5 w-5"/>{items.length>0&&<span className="absolute right-0 top-0 rounded-full bg-[#A94E38] px-1.5 text-[10px] text-white">{items.length}</span>}</summary><div className="fixed right-4 top-16 max-h-80 w-72 max-w-[calc(100vw-2rem)] sm:absolute sm:right-0 sm:top-12 overflow-y-auto rounded-xl border border-[#CEC8BD] bg-white p-3 shadow-lg"><p className="mb-2 text-sm font-semibold">Menções em documentos</p>{!items.length?<p className="py-3 text-xs text-[#625E59]">Nenhuma menção pendente.</p>:items.map(item=><Link key={item.id} href={`/community/tools/mapa-contratos?section=${item.section_id}#contribution-${item.contribution_id}`} onClick={()=>void read(item.id).catch(()=>{})} className="block rounded-lg p-3 text-xs leading-5 hover:bg-[#F5F1E8]">{item.preview}</Link>)}</div></details>
}
