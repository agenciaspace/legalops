'use client'

import { useRef, useState } from 'react'
import { Check, Copy, Mail } from 'lucide-react'
import { CLUB_PIX_KEY, CLUB_PIX_KEY_TYPE, buildClubProofMailto } from '@/lib/club-checkout'
import { formatBRL } from '@/lib/club-pricing'

export function PixCheckoutCard({ amount }: { amount: number }) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle')
  const keyInput = useRef<HTMLInputElement>(null)

  async function copyPixKey() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(CLUB_PIX_KEY)
      } else {
        keyInput.current?.select()
        if (!document.execCommand('copy')) throw new Error('Copy command failed')
      }
      setCopyStatus('copied')
    } catch {
      keyInput.current?.select()
      setCopyStatus('failed')
    }
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-[#CEC8BD] bg-white shadow-[0_24px_70px_rgba(17,17,17,0.08)]">
      <div className="border-b border-[#E6DED0] bg-[#111111] px-6 py-7 text-white sm:px-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#E88A6A]">acesso fundador</p>
        <div className="mt-3 flex items-end gap-2">
          <span className="text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">{formatBRL(amount)}</span>
          <span className="pb-1 text-sm text-white/55">por 12 meses</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-white/65">Pagamento único, sem renovação automática.</p>
      </div>

      <div className="p-6 sm:p-8">
        <label htmlFor="club-pix-key" className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#77716A]">
          chave PIX ({CLUB_PIX_KEY_TYPE})
        </label>
        <div className="mt-2 flex gap-2">
          <input
            ref={keyInput}
            id="club-pix-key"
            readOnly
            value={CLUB_PIX_KEY}
            className="min-w-0 flex-1 rounded-xl border border-[#CEC8BD] bg-[#FAF7F1] px-4 py-3 text-sm font-semibold text-[#111111] outline-none"
          />
          <button
            type="button"
            onClick={copyPixKey}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#E88A6A] px-4 text-xs font-bold text-[#111111] transition hover:bg-[#DE7B5C]"
          >
            {copyStatus === 'copied' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copyStatus === 'copied' ? 'Copiado' : 'Copiar'}
          </button>
        </div>
        <p aria-live="polite" className="mt-2 min-h-5 text-xs text-[#77716A]">
          {copyStatus === 'copied' && 'Chave copiada. Cole no app do seu banco.'}
          {copyStatus === 'failed' && 'Selecione a chave acima e copie manualmente.'}
        </p>

        <a
          href={buildClubProofMailto(amount)}
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#111111] px-5 text-sm font-bold text-white transition hover:bg-[#2A2927]"
        >
          <Mail className="h-4 w-4" /> Já paguei — enviar comprovante
        </a>
        <p className="mt-3 text-center text-xs leading-5 text-[#77716A]">
          O email será aberto com uma mensagem pronta. Informe o email que receberá o acesso e anexe o comprovante.
        </p>
      </div>
    </div>
  )
}
