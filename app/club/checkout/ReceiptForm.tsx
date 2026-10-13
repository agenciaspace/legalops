'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitProReceipt } from './actions'
import { PRO_PIX_KEY } from '@/lib/club-pro'
export function ReceiptForm({ orderId, paymentUrl, submitReceipt = submitProReceipt }: { orderId: string; paymentUrl?: string | null; submitReceipt?: typeof submitProReceipt }) {
  const router = useRouter()
  const [busy,setBusy] = useState(false)
  const [message,setMessage] = useState('')
  const [copied,setCopied] = useState(false)
  return <div className="space-y-5">
    {paymentUrl ? <div className="brand-card p-4"><p className="text-sm leading-6">Conclua sua assinatura no Mercado Pago. Use o email da sua conta no Club para ajudar na conferência.</p><a href={paymentUrl} target="_blank" rel="noopener noreferrer" className="brand-action mt-4">Abrir assinatura no Mercado Pago ↗</a><p className="mt-3 text-xs leading-6">Depois, volte a esta página e envie a confirmação da assinatura. A administração confere o cadastro e libera o acesso em até um dia útil.</p></div> : <div className="brand-card p-4"><p className="text-xs text-[var(--lo-muted)]">Chave PIX · email</p><p className="mt-2 break-all font-semibold">{PRO_PIX_KEY}</p><button className="brand-text-link mt-3" onClick={async () => { try { await navigator.clipboard.writeText(PRO_PIX_KEY);setCopied(true) } catch { setMessage('Selecione e copie a chave PIX acima.') } }}>{copied ? 'Chave copiada' : 'Copiar chave PIX'}</button><p className="mt-2 text-xs leading-5 text-[var(--lo-muted)]">Confira o nome do recebedor no seu banco antes de confirmar o PIX. O envio do comprovante não ativa o acesso sozinho.</p></div>}
    <form onSubmit={async event => { event.preventDefault();setBusy(true);setMessage('');const form=new FormData(event.currentTarget);try { const result=await submitReceipt(form);if(result.ok) router.refresh();else setMessage(result.error ?? 'Tente novamente.') } catch { setMessage('Não conseguimos conectar. Tente novamente.') } finally { setBusy(false) } }}>
      <input type="hidden" name="order_id" value={orderId} />
      <label className="block text-sm font-semibold">{paymentUrl ? 'Confirmação da assinatura ou comprovante' : 'Comprovante do PIX'}<input required type="file" name="receipt" accept="application/pdf,image/png,image/jpeg" className="mt-3 block w-full max-w-full text-xs" /></label><p className="mt-2 text-xs text-[var(--lo-muted)]">PDF, PNG ou JPG de até 5 MB. Visível apenas para você e a administração.</p>
      <button disabled={busy} className="brand-action mt-5 w-full disabled:opacity-50">{busy ? 'Enviando…' : 'Enviar comprovante para conferência'}</button>
    </form>{message && <p role="alert" className="text-sm text-red-700">{message}</p>}
  </div>
}
