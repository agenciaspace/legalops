import { MemberAvatar } from './MemberAvatar'
import { groupEventPublications, type EventResource } from '@/lib/event-publications'

type Author = { user_id: string; display_name: string; avatar_path: string | null; current_role: string | null; organization_name: string | null }

export function EventPublications({ resources, authors }: { resources: EventResource[]; authors: Author[] }) {
  const profiles = new Map(authors.map(author => [author.user_id, author]))
  const publications = groupEventPublications(resources)
  if (!publications.length) return <p className="mt-5 text-sm text-[#69635E]">Ainda não há publicações nesta aba. Compartilhe o primeiro registro do encontro.</p>
  return <div className="mt-6 space-y-6">{publications.map(files => {
    const first = files[0]
    const author = profiles.get(first.uploader_id)
    const name = author?.display_name || 'Membro da comunidade'
    // Legacy uploads stored the file name after a repeated caption.
    const caption = first.description || (first.title.includes(' · ') ? first.title.split(' · ')[0] : '')
    return <article key={`${first.uploader_id}:${first.publication_id}`} aria-label={`Publicação de ${name}`} className="overflow-hidden rounded-xl border border-[#CEC8BD] bg-white">
      <header className="flex items-center gap-3 p-4 sm:p-5">
        <MemberAvatar userId={author?.user_id} path={author?.avatar_path} name={name} size="h-11 w-11" />
        <div className="min-w-0"><p className="text-sm font-bold text-[#24231F]">{name}</p>{author && <p className="text-xs text-[#69635E]">{[author.current_role, author.organization_name].filter(Boolean).join(' · ')}</p>}<time dateTime={first.created_at} className="text-xs text-[#817A73]">{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(first.created_at))}</time></div>
      </header>
      {caption && <p className="whitespace-pre-wrap break-words px-4 pb-4 text-sm leading-6 text-[#24231F] sm:px-5">{caption}</p>}
      {first.kind === 'foto' ? <div className={`grid gap-1 bg-[#FAF7F1] ${files.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>{files.map((file, index) => {
        const source = file.storage_path ? `/api/community/events/resources/${file.id}` : file.resource_url
        if (!source) return null
        return <a key={file.id} href={source} target="_blank" rel="noreferrer" aria-label={`Ampliar foto ${index + 1} de ${files.length}`} className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C9684F]">
          <img src={source} alt={`Foto ${index + 1} do encontro, compartilhada por ${name}`} loading="lazy" className={`w-full ${files.length === 1 ? 'max-h-[36rem] object-contain' : 'aspect-square object-cover'}`} />
        </a>
      })}</div> : <ul className="space-y-2 px-4 pb-4 sm:px-5">{files.map(file => <li key={file.id}><a href={file.storage_path ? `/api/community/events/resources/${file.id}?download=1` : file.resource_url ?? '#'} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-[#E6DED0] px-3 py-2 text-sm font-semibold hover:bg-[#FAF7F1]"><span className="min-w-0 break-all">{file.title.split(' · ').pop()}</span><span className="shrink-0 text-xs text-[#C9684F]">Abrir ↗</span></a></li>)}</ul>}
    </article>
  })}</div>
}
