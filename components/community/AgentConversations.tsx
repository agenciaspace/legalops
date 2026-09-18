'use client'
import { Trash2, X } from 'lucide-react'
import { useClubLanguage } from './ClubLanguage'

export type AgentConversation = { id: string; title: string; created_at: string; updated_at: string }

export function AgentConversations({ conversations, selected, disabled, hasMore, loadingMore, onSelect, onDelete, onMore, onClose }: {
  conversations: AgentConversation[]; selected: string | null; disabled: boolean; hasMore: boolean; loadingMore: boolean
  onSelect: (id: string) => void; onDelete: (conversation: AgentConversation) => void; onMore: () => void; onClose: () => void
}) {
  const { t } = useClubLanguage()
  return <aside id="agent-conversations" aria-label={t('Suas conversas')} className="absolute inset-0 z-20 flex min-h-0 flex-col bg-[#FAF7F1] p-3 md:relative md:inset-auto md:mr-4 md:w-60 md:shrink-0 md:border-r md:border-[#E6DED0]">
    <div className="flex shrink-0 items-center justify-between gap-2"><h2 className="text-sm font-semibold">{t('Suas conversas')}</h2><button onClick={onClose} aria-label={t('Fechar lista de conversas')} className="flex min-h-11 min-w-11 items-center justify-center"><X className="h-4 w-4" /></button></div>
    <div className="min-h-0 flex-1 overflow-y-auto">
      {!conversations.length ? <p className="py-4 text-sm text-[#625E59]">{t('Nenhuma conversa ainda.')}</p> : null}
      <ul className="space-y-1">{conversations.map(conversation => <li key={conversation.id} className={`flex min-w-0 items-center rounded-lg ${conversation.id === selected ? 'bg-[#E9E3D8]' : 'hover:bg-[#F0EEE8]'}`}>
        <button disabled={disabled} onClick={() => onSelect(conversation.id)} aria-current={conversation.id === selected ? 'true' : undefined} title={conversation.title} className="min-h-11 min-w-0 flex-1 truncate px-3 text-left text-sm disabled:opacity-50">{t(conversation.title)}</button>
        <button disabled={disabled} onClick={() => onDelete(conversation)} aria-label={t('Apagar conversa: {title}', { title: t(conversation.title) })} className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-[#625E59] hover:bg-red-50 hover:text-red-700 disabled:opacity-40"><Trash2 className="h-4 w-4" /></button>
      </li>)}</ul>
      {hasMore ? <button disabled={disabled || loadingMore} onClick={onMore} className="mt-3 min-h-11 w-full rounded-lg border border-[#CEC8BD] px-3 text-sm disabled:opacity-40">{loadingMore ? t('Carregando…') : t('Carregar mais conversas')}</button> : null}
    </div>
  </aside>
}
