'use client'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {CalendarDays,MessageCircle,Sparkles} from 'lucide-react'
const items=[{href:'/community',label:'Comunidade',icon:MessageCircle},{href:'/community/calendar',label:'Eventos',icon:CalendarDays}]
export function CommunityTabs(){const path=usePathname();return <nav aria-label="Áreas do Club" className="club-bottom-nav fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-[#CEC8BD] bg-[#F5F1E8] px-2 pt-1 lg:static lg:mx-auto lg:mb-2 lg:max-w-3xl lg:border-t-0 lg:border-b lg:px-6 lg:pt-3">{items.map(item=>{const active=item.href==='/community'?path===item.href:item.href==='/community/assistant'?['/community/assistant','/community/pro','/community/agents'].includes(path):path.startsWith(item.href);return <Link key={item.href} href={item.href} aria-current={active?'page':undefined} className={`flex min-h-14 items-center justify-center gap-2 rounded-xl text-xs font-semibold sm:text-sm ${active?'bg-[#E9E4D9] text-[#A94E38]':'text-[#625E59]'}`}><item.icon className="h-4 w-4 shrink-0"/>{item.label}</Link>})}</nav>}
