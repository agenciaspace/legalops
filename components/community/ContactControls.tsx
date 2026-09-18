'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveContactDetails, saveCommunityContact } from '@/app/(main)/community/contact/actions'
import { contactUrl, type ContactDetails } from '@/lib/contact-card'

export function ContactSettings({ details }: { details: ContactDetails }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  return <form onSubmit={async event => {
    event.preventDefault(); if (busy) return
    const form = new FormData(event.currentTarget)
    setBusy(true); setMessage(''); setError('')
    try { const result = await saveContactDetails(form); if (result.error) setError(result.error); else { setMessage('Contato atualizado. Seu QR code continua o mesmo.'); router.refresh() } }
    catch { setError('Falha de conexão. Tente novamente.') } finally { setBusy(false) }
  }} className="space-y-4">
    <p className="text-sm leading-6 text-[#69635E]">Nome, cargo, empresa e LinkedIn vêm do seu perfil. Preencha abaixo somente os contatos que deseja compartilhar com os membros.</p>
    <label className="block text-sm font-semibold">Email de contato<input type="email" name="email" maxLength={254} defaultValue={details.email ?? ''} autoComplete="email" className="mt-2 min-h-11 w-full rounded-lg border border-[#CEC8BD] bg-white px-3 font-normal" /></label>
    <label className="block text-sm font-semibold">Telefone / WhatsApp<input type="tel" name="phone" maxLength={30} defaultValue={details.phone ?? ''} placeholder="+55 11 99999-9999" autoComplete="tel" className="mt-2 min-h-11 w-full rounded-lg border border-[#CEC8BD] bg-white px-3 font-normal" /></label>
    <label className="block text-sm font-semibold">Site<input type="url" name="website" maxLength={500} defaultValue={details.website ?? ''} placeholder="https://" className="mt-2 min-h-11 w-full rounded-lg border border-[#CEC8BD] bg-white px-3 font-normal" /></label>
    <label className="flex items-start gap-3 rounded-lg bg-[#F5F1E8] p-3 text-sm leading-6"><input type="checkbox" name="public_enabled" defaultChecked={details.public_enabled} className="mt-1 h-5 w-5 shrink-0 accent-[#24231F]" /><span>Permitir acesso sem login a este cartão, incluindo nome, cargo, empresa, LinkedIn e os contatos preenchidos acima.<span className="mt-1 block text-xs text-[#69635E]">Desmarque para restringir novamente aos membros. Contatos já salvos no celular de outra pessoa não são apagados.</span></span></label>
    <p role={error ? 'alert' : 'status'} className={`text-sm ${error ? 'text-red-700' : 'text-[#69635E]'}`}>{error || message}</p>
    <button disabled={busy} className="min-h-11 rounded-lg bg-[#24231F] px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Salvando…' : 'Salvar contatos'}</button>
  </form>
}

export function ShareContact({ id }: { id: string }) {
  const [message, setMessage] = useState('')
  const url = contactUrl(id)
  return <div><div className="flex flex-wrap justify-center gap-2"><button onClick={async () => {
    try { if (navigator.share) await navigator.share({ title: 'Contato · legalops.club', url }); else { await navigator.clipboard.writeText(url); setMessage('Link copiado.') } }
    catch (error) { if (!(error instanceof Error && error.name === 'AbortError')) setMessage('Não foi possível compartilhar. Use o link abaixo.') }
  }} className="min-h-11 rounded-lg bg-[#24231F] px-4 text-sm font-semibold text-white">Compartilhar</button><a href={`/contact/${id}/qr?download=1`} download="meu-qr-code.svg" className="inline-flex min-h-11 items-center rounded-lg border border-[#CEC8BD] px-4 text-sm font-semibold">Baixar QR code</a></div><a href={url} className="mt-3 block break-all text-center text-xs text-[#69635E] underline">Abrir meu cartão de contato</a><p role="status" className="mt-2 text-center text-xs">{message}</p></div>
}

export function SaveContactButton({ id, initialSaved }: { id: string; initialSaved: boolean }) {
  const [saved, setSaved] = useState(initialSaved)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  return <div><button disabled={busy} onClick={async () => {
    if (busy) return
    setBusy(true); setMessage('')
    try { const result = await saveCommunityContact(id, !saved); if (result.error) setMessage(result.error); else { setSaved(!saved); setMessage(saved ? 'Contato removido da sua lista.' : 'Salvo em Membros → Meus contatos.') } }
    catch { setMessage('Falha de conexão. Tente novamente.') } finally { setBusy(false) }
  }} className="min-h-11 w-full rounded-lg border border-[#CEC8BD] bg-white px-4 text-sm font-semibold disabled:opacity-50">{busy ? 'Salvando…' : saved ? 'Remover dos meus contatos' : 'Salvar na comunidade'}</button><p role="status" className="mt-2 text-xs text-[#69635E]">{message}</p></div>
}
