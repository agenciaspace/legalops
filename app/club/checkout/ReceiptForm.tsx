'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitProReceipt } from './actions'
import { PRO_PIX_KEY } from '@/lib/club-pro'
export function ReceiptForm({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [busy,setBusy] = useState(false)
  const [message,setMessage] = useState('')
  const [copied,setCopied] = useState(false)
  return <div className="space-y-5">
    <div className="rounded-lg border border-[#CEC8BD] p-4"><p className="text-xs text-[#69635E]">Chave PIX · email</p><p className="mt-2 break-all font-semibold">{PRO_PIX_KEY}</p><button className="mt-3 min-h-11 text-sm font-bold underline" onClick={async () => { try { await navigator.clipboard.writeText(PRO_PIX_KEY);setCopied(true) } catch { setMessage('Selecione e copie a chave PIX acima.') } }}>{copied ? 'Chave copiada' : 'Copiar chave PIX'}</button><p className="mt-2 text-xs leading-5 text-[#69635E]">Confira o nome do recebedor no seu banco antes de confirmar o PIX. O envio do comprovante não ativa o acesso sozinho.</p></div>
    <form onSubmit={async event => { event.preventDefault();setBusy(true);setMessage('');const form=new FormData(event.currentTarget);try { const result=await submitProReceipt(form);if(result.ok) router.refresh();else setMessage(result.error ?? 'Tente novamente.') } catch { setMessage('Não conseguimos conectar. Tente novamente.') } finally { setBusy(false) } }}>
      <input type="hidden" name="order_id" value={orderId} />
      <label className="block text-sm font-semibold">Comprovante do PIX<input required type="file" name="receipt" accept="application/pdf,image/png,image/jpeg" className="mt-3 block w-full max-w-full text-xs" /></label><p className="mt-2 text-xs text-[#69635E]">PDF, PNG ou JPG de até 5 MB. Visível apenas para você e a administração.</p>
      <button disabled={busy} className="mt-5 w-full rounded-lg bg-[#111111] px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? 'Enviando…' : 'Enviar comprovante para conferência'}</button>
    </form>{message && <p role="alert" className="text-sm text-red-700">{message}</p>}
  </div>
}
