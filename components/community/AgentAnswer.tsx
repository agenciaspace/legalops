'use client'
import { memo, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check } from 'lucide-react'

export const AgentAnswer = memo(function AgentAnswer({ answer }: { answer: string }) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  return <><div className="agent-answer text-base leading-7 text-[#34312C]">
    <Markdown remarkPlugins={[remarkGfm]} skipHtml components={{
      a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
      table: ({ children }) => <div className="max-w-full overflow-x-auto"><table>{children}</table></div>,
      // Answers should not load third-party tracking images.
      img: ({ alt }) => <span>{alt}</span>,
    }}>{answer}</Markdown>
  </div><button type="button" aria-label={copied ? 'Resposta copiada' : 'Copiar resposta'} onClick={async () => {
    try { await navigator.clipboard.writeText(answer); setCopied(true); setError('') }
    catch { setError('Não foi possível copiar. Selecione o texto da resposta.') }
  }} className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-xs text-[#817A73] hover:bg-[#F5F1E8]">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Copiado' : 'Copiar'}</button>{error && <p role="status" className="text-xs text-red-700">{error}</p>}</>
})
