'use client'
import { useState } from 'react'
import { getInitials } from '@/lib/community'
export function MemberAvatar({userId,path,name,size='h-14 w-14'}:{userId?:string|null;path?:string|null;name:string;size?:string}) {
  const [failed,setFailed]=useState<string|null>(null)
  const src=userId&&path?`/api/club/avatar/${encodeURIComponent(userId)}?v=${encodeURIComponent(path.split('/').pop() || '')}`:null
  return <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E9E4D9] font-semibold text-[#24231F] ${size}`}>{src&&failed!==src?<img src={src} alt={`Foto de ${name}`} className="h-full w-full object-cover" loading="lazy" onError={()=>setFailed(src)}/>:<span aria-label={name}>{getInitials(name)}</span>}</span>
}
