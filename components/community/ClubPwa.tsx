'use client'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
type InstallEvent = Event & {prompt: () => Promise<void>; userChoice: Promise<{outcome:'accepted'|'dismissed'}>}
export function ClubPwa() {
  const pathname = usePathname()
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)')
    const update = () => setInstalled(standalone.matches || Boolean((navigator as Navigator & {standalone?:boolean}).standalone))
    update(); standalone.addEventListener('change', update)
    const capture = (event: Event) => {event.preventDefault();setInstallEvent(event as InstallEvent)}
    const complete = () => {setInstalled(true);setInstallEvent(null)}
    window.addEventListener('beforeinstallprompt', capture)
    window.addEventListener('appinstalled', complete)
    if ('serviceWorker' in navigator && window.isSecureContext) void navigator.serviceWorker.register('/club-sw.js', {scope:'/',updateViaCache:'none'}).catch(() => {})
    return () => {standalone.removeEventListener('change',update);window.removeEventListener('beforeinstallprompt',capture);window.removeEventListener('appinstalled',complete)}
  }, [])
  async function install() {
    if (!installEvent) {setShowHelp(true);return}
    try {await installEvent.prompt();const choice=await installEvent.userChoice;if(choice.outcome==='accepted')setInstalled(true)}
    catch {setMessage('Use o menu do navegador para adicionar o Club à tela inicial.');setShowHelp(true)}
    finally {setInstallEvent(null)}
  }
  if (installed || pathname === '/community/assistant') return null
  return <div className="mx-4 mt-4 rounded-xl border border-[#CEC8BD] bg-white px-4 py-2 sm:mx-6 lg:mx-8"><div className="flex flex-wrap items-center justify-between gap-x-3"><p className="text-sm text-[#625E59]">Club na tela inicial</p><button type="button" onClick={() => void install()} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#A94E38]"><Download className="h-4 w-4" />Instalar app</button></div>{showHelp ? <div className="border-t border-[#E6DED0] py-3 text-sm leading-6"><div className="flex items-start justify-between gap-2"><p>No iPhone, abra Compartilhar e escolha “Adicionar à Tela de Início”. No Android ou computador, procure “Instalar app” no menu do navegador.</p><button type="button" onClick={() => setShowHelp(false)} className="flex min-h-11 min-w-11 items-center justify-center" aria-label="Fechar instruções"><X className="h-4 w-4" /></button></div><p className="mt-2 text-xs text-[#817A73]">A disponibilidade depende do navegador. Posts, confirmações e Pro precisam de conexão.</p>{message ? <p role="status">{message}</p> : null}</div> : null}</div>
}
