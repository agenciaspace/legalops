import Link from 'next/link'
import {
  ArrowRight,
  Heart,
  Image as ImageIcon,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Pin,
  Search,
  Send,
  Smile,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  COMMUNITY_CATEGORIES,
  formatCommunityDate,
  getAvatarTone,
  getCommunityCategory,
  getInitials,
  hasActiveClubAccess,
} from '@/lib/community'
import { createCommunityComment, createCommunityPost, toggleCommunityPostLike } from './actions'
import { CommunityAgentCard } from './CommunityAgentCard'

type Comment = {
  id: string
  author_name: string
  body: string
  created_at: string
}

type Like = { user_id: string }

type Post = {
  id: string
  author_name: string
  author_role: string | null
  category: string
  title: string
  body: string
  is_pinned: boolean
  created_at: string
  community_comments: Comment[]
  community_post_likes: Like[]
}

type Event = {
  title: string
  starts_at: string
  event_type: string
}

type Member = {
  user_id: string
  display_name: string
  current_role: string | null
}

export const dynamic = 'force-dynamic'

export default async function CommunityPage({ searchParams }: { searchParams?: { space?: string; upgrade?: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const requestedSpace = searchParams?.space
  const selectedSpace = requestedSpace && COMMUNITY_CATEGORIES[requestedSpace] ? requestedSpace : null
  const { data: clubAccess } = await supabase
    .from('community_members')
    .select('club_access_status, club_access_expires_at')
    .eq('user_id', user?.id ?? '')
    .maybeSingle()
  const hasPaidAccess = hasActiveClubAccess(clubAccess)

  let postsQuery = supabase
    .from('community_posts')
    .select('id, author_name, author_role, category, title, body, is_pinned, created_at, community_comments(id, author_name, body, created_at), community_post_likes(user_id)')

  if (selectedSpace) postsQuery = postsQuery.eq('category', selectedSpace)

  const [{ data: rawPosts }, { data: rawEvent }, { data: rawMembers }] = await Promise.all([
    postsQuery
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('community_events')
      .select('title, starts_at, event_type')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('community_members')
      .select('user_id, display_name, current_role')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const posts = (rawPosts ?? []) as Post[]
  const upcomingEvent = rawEvent as Event | null
  const newMembers = (rawMembers ?? []) as Member[]
  const activeSpace = selectedSpace ? COMMUNITY_CATEGORIES[selectedSpace] : null
  const trendingPosts = [...posts]
    .sort((a, b) => (
      (b.community_post_likes?.length ?? 0) + (b.community_comments?.length ?? 0) * 2
    ) - (
      (a.community_post_likes?.length ?? 0) + (a.community_comments?.length ?? 0) * 2
    ))
    .slice(0, 3)

  return (
    <div className="mx-auto w-full max-w-[1160px] px-4 py-5 sm:px-6 lg:px-7 lg:py-7">
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="min-w-0">
          <header className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[22px] font-extrabold tracking-[-0.025em] text-[#24231F]">{activeSpace?.title ?? 'Início'}</h1>
                {selectedSpace === 'anuncio' ? <span className="rounded bg-[#FFF0E9] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-[#D9470F]">Oficial</span> : null}
              </div>
              <p className="mt-1 text-xs leading-5 text-[#77746E]">
                {activeSpace?.description ?? 'Acompanhe as conversas e novidades da comunidade.'}
              </p>
            </div>
            <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#7D7A75] hover:bg-white" aria-label="Mais opções">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </header>

          {!hasPaidAccess ? (
            <section className="mb-4 overflow-hidden rounded-xl border border-[#FFD0BD] bg-[#FFF6F1] p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#292825] text-white"><Lock className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#D9470F]">Prévia aberta</p>
                  <h2 className="mt-1 text-sm font-extrabold text-[#292824]">Você está vendo uma parte do conteúdo.</h2>
                  <p className="mt-1 text-[11px] leading-5 text-[#77746E]">Assinantes acessam as conversas completas, lives, resumos, diretório de membros e alertas de vagas comparados com o perfil.</p>
                  <Link href="/club#planos" className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#FF5C1A] px-3 py-2 text-[10px] font-extrabold text-white hover:bg-[#E84D10]">
                    Ver lotes de lançamento <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </section>
          ) : null}

          {!selectedSpace ? (
            <section className="mb-4 overflow-hidden rounded-xl border border-[#E2D4CB] bg-[#2A2926] text-white">
              <div className="relative px-5 py-5 sm:px-6 sm:py-6">
                <div className="absolute -right-10 -top-20 h-48 w-48 rounded-full bg-[#FF5C1A]/30 blur-3xl" />
                <div className="relative flex items-start gap-4">
                  <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FF5C1A] text-sm font-black sm:flex">LO</div>
                  <div className="max-w-xl">
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-[#FF9A72]"><Sparkles className="h-3.5 w-3.5" /> Bem-vindo ao Club</div>
                    <h2 className="mt-2 text-xl font-extrabold tracking-[-0.025em]">A casa de quem constrói operações jurídicas melhores.</h2>
                    <p className="mt-2 text-xs leading-5 text-white/60">Apresente-se, encontre um espaço e compartilhe o desafio que está na sua mesa hoje.</p>
                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                      <Link href="/community?space=apresentacoes" className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-white hover:text-[#FF9A72]">
                        Começar por aqui <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      {hasPaidAccess ? (
                        <Link href="/community/jobs" className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#FF9A72] hover:text-white">
                          Ver vagas para o meu perfil <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {selectedSpace ? <CommunityAgentCard category={selectedSpace} hasPaidAccess={hasPaidAccess} /> : null}

          {hasPaidAccess ? <details id="new-post" className="group mb-4 overflow-hidden rounded-xl border border-[#E2E2DE] bg-white" open={posts.length === 0}>
            <summary className="flex cursor-pointer list-none items-center gap-3 p-3.5 sm:px-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FF5C1A] text-[10px] font-black text-white">
                {getInitials(user?.email?.split('@')[0] ?? 'LO')}
              </div>
              <div className="flex-1 rounded-lg border border-[#E8E8E4] bg-[#FAFAF8] px-3.5 py-2.5 text-xs text-[#8A8782] transition group-hover:border-[#D9D8D3] group-open:border-[#FFD6C7] group-open:bg-[#FFF8F5]">
                No que você está pensando?
              </div>
              <button className="hidden h-9 items-center gap-1.5 rounded-lg bg-[#FF5C1A] px-3 text-[11px] font-extrabold text-white sm:flex" type="button">Criar post</button>
            </summary>
            <form action={createCommunityPost} className="space-y-3 border-t border-[#ECECE8] p-4">
              <input
                name="title"
                required
                minLength={3}
                maxLength={180}
                placeholder="Título da publicação"
                className="w-full border-0 px-1 text-base font-extrabold outline-none placeholder:font-semibold placeholder:text-[#AAA8A2]"
              />
              <textarea
                name="body"
                required
                minLength={3}
                maxLength={10000}
                rows={4}
                placeholder="Escreva algo para a comunidade…"
                className="w-full resize-y border-0 px-1 text-sm leading-6 outline-none placeholder:text-[#AAA8A2]"
              />
              <div className="flex flex-col gap-3 border-t border-[#ECECE8] pt-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-1 text-[#7D7A75]">
                  <button type="button" className="rounded-md p-1.5 hover:bg-[#F3F3F0]" aria-label="Adicionar imagem"><ImageIcon className="h-4 w-4" /></button>
                  <button type="button" className="rounded-md p-1.5 hover:bg-[#F3F3F0]" aria-label="Adicionar arquivo"><Paperclip className="h-4 w-4" /></button>
                  <button type="button" className="rounded-md p-1.5 hover:bg-[#F3F3F0]" aria-label="Adicionar emoji"><Smile className="h-4 w-4" /></button>
                  <select name="category" defaultValue={selectedSpace ?? 'discussao'} className="ml-1 rounded-lg border border-[#E2E1DD] bg-white px-2.5 py-1.5 text-[10px] font-bold outline-none focus:border-[#FF5C1A]">
                    {Object.entries(COMMUNITY_CATEGORIES).filter(([key]) => key !== 'anuncio').map(([key, value]) => (
                      <option key={key} value={key}>{value.label}</option>
                    ))}
                  </select>
                </div>
                <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#FF5C1A] px-4 py-2 text-[11px] font-extrabold text-white transition hover:bg-[#E84D10]">
                  Publicar <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </details> : null}

          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1 rounded-lg bg-[#ECECE8] p-1 text-[10px] font-bold text-[#77746E]">
              <span className="rounded-md bg-white px-2.5 py-1.5 text-[#252420] shadow-sm">Recentes</span>
              <span className="px-2.5 py-1.5">Em alta</span>
            </div>
            <button className="flex items-center gap-1.5 text-[10px] font-bold text-[#88857F]"><Search className="h-3.5 w-3.5" /> Buscar neste espaço</button>
          </div>

          {posts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D9D8D3] bg-white/60 p-10 text-center">
              <MessageCircle className="mx-auto h-7 w-7 text-[#FF5C1A]" />
              <h2 className="mt-4 text-sm font-extrabold">Abra a primeira conversa</h2>
              <p className="mt-2 text-xs text-[#77746E]">Compartilhe um desafio para começar este espaço.</p>
            </div>
          ) : null}

          <div className="space-y-3">
            {posts.map(post => {
              const category = getCommunityCategory(post.category)
              const comments = [...(post.community_comments ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at))
              const likes = post.community_post_likes ?? []
              const likedByUser = likes.some(like => like.user_id === user?.id)

              return (
                <article key={post.id} className="rounded-xl border border-[#E1E1DD] bg-white p-4 transition hover:border-[#D2D1CC] sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black ${getAvatarTone(post.author_name)}`}>
                      {getInitials(post.author_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-[13px] font-extrabold text-[#292824]">{post.author_name}</span>
                        {post.author_role ? <span className="text-[10px] text-[#8A8782]">{post.author_role}</span> : null}
                      </div>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[9px] text-[#9A9791]">
                        {formatCommunityDate(post.created_at, true)}
                        <span>·</span>
                        <span>{category.label}</span>
                      </p>
                    </div>
                    {post.is_pinned ? <Pin className="h-3.5 w-3.5 rotate-45 text-[#FF5C1A]" aria-label="Publicação fixada" /> : null}
                    <button className="text-[#9A9791] hover:text-[#393833]" aria-label="Mais opções da publicação"><MoreHorizontal className="h-4 w-4" /></button>
                  </div>

                  <div className="mt-4 pl-0 sm:pl-[52px]">
                    {post.is_pinned ? <span className="mb-2 inline-flex rounded-md bg-[#FFF0E9] px-2 py-0.5 text-[8px] font-black uppercase tracking-wide text-[#D9470F]">Fixado</span> : null}
                    <h2 className="text-[17px] font-extrabold leading-6 tracking-[-0.015em] text-[#252420]">{post.title}</h2>
                    <p className="mt-2 whitespace-pre-wrap text-[13px] leading-[1.65] text-[#68655F]">{post.body}</p>
                  </div>

                  {hasPaidAccess ? <div className="mt-5 flex items-center gap-4 border-t border-[#ECECE8] pb-0 pt-3 text-[10px] font-bold text-[#77746E] sm:ml-[52px]">
                    <form action={toggleCommunityPostLike}>
                      <input type="hidden" name="post_id" value={post.id} />
                      <button className={`flex items-center gap-1.5 rounded-md px-1 py-1 transition hover:text-[#D9470F] ${likedByUser ? 'text-[#D9470F]' : ''}`} aria-label={likedByUser ? 'Remover curtida' : 'Curtir'}>
                        <Heart className={`h-4 w-4 ${likedByUser ? 'fill-current' : ''}`} /> {likes.length || 'Curtir'}
                      </button>
                    </form>
                    <span className="flex items-center gap-1.5"><MessageCircle className="h-4 w-4" /> {comments.length || 'Comentar'}</span>
                  </div> : (
                    <div className="mt-5 flex items-center gap-2 border-t border-[#ECECE8] pt-3 text-[10px] font-bold text-[#9A9791] sm:ml-[52px]">
                      <Lock className="h-3.5 w-3.5" /> Interações disponíveis para assinantes
                    </div>
                  )}

                  {hasPaidAccess && comments.length > 0 ? (
                    <div className="mt-3 space-y-2 border-t border-[#ECECE8] pt-3 sm:ml-[52px]">
                      {comments.slice(-3).map(comment => (
                        <div key={comment.id} className="flex gap-2 rounded-lg bg-[#F7F7F5] px-3 py-2.5 text-[11px] leading-5">
                          <span className="font-extrabold text-[#292824]">{comment.author_name}</span>
                          <span className="text-[#68655F]">{comment.body}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {hasPaidAccess ? <form action={createCommunityComment} className="mt-3 flex gap-2 sm:ml-[52px]">
                    <input type="hidden" name="post_id" value={post.id} />
                    <input
                      name="body"
                      required
                      maxLength={3000}
                      placeholder="Escreva um comentário…"
                      aria-label={`Comentar em ${post.title}`}
                      className="min-w-0 flex-1 rounded-lg border border-[#E4E3DF] bg-[#FAFAF8] px-3 py-2 text-[11px] outline-none focus:border-[#FFB99E] focus:bg-white"
                    />
                    <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#292825] text-white transition hover:bg-[#FF5C1A]" aria-label="Enviar comentário">
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </form> : null}
                </article>
              )
            })}
          </div>
        </section>

        <aside className="hidden space-y-4 xl:sticky xl:top-[5.75rem] xl:block">
          {!hasPaidAccess ? (
            <section className="rounded-xl bg-[#292825] p-5 text-white">
              <Lock className="h-5 w-5 text-[#FF7A45]" />
              <h2 className="mt-4 text-sm font-extrabold">O restante acontece por dentro.</h2>
              <p className="mt-2 text-[10px] leading-5 text-white/60">A assinatura anual inclui as conversas completas, lives, resumos, diretório validado e alertas de vagas com ajustes de CV.</p>
              <Link href="/club#planos" className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#FF8B5D] hover:text-white">Escolher meu lote <ArrowRight className="h-3.5 w-3.5" /></Link>
            </section>
          ) : <>
          <section className="rounded-xl border border-[#E1E1DD] bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold text-[#292824]">Próximo evento</h2>
              <Link href="/community/calendar" className="text-[9px] font-bold text-[#D9470F] hover:underline">Ver todos</Link>
            </div>
            {upcomingEvent ? (
              <div className="mt-4 flex gap-3">
                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-[#FFF0E9] text-[#D9470F]">
                  <span className="text-sm font-black leading-none">{new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit' }).format(new Date(upcomingEvent.starts_at))}</span>
                  <span className="mt-0.5 text-[7px] font-black uppercase">{new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', month: 'short' }).format(new Date(upcomingEvent.starts_at)).replace('.', '')}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-extrabold leading-4 text-[#292824]">{upcomingEvent.title}</p>
                  <p className="mt-1 text-[9px] text-[#8A8782]">{formatCommunityDate(upcomingEvent.starts_at, true)} · BRT</p>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-lg bg-[#F7F7F5] p-3 text-[10px] leading-4 text-[#77746E]">A próxima programação entra no ar em breve.</div>
            )}
          </section>

          <section className="rounded-xl border border-[#E1E1DD] bg-white p-4">
            <div className="flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5 text-[#FF5C1A]" /><h2 className="text-xs font-extrabold">Em alta</h2></div>
            <div className="mt-3 divide-y divide-[#ECECE8]">
              {trendingPosts.map(post => (
                <div key={post.id} className="py-3 first:pt-1 last:pb-0">
                  <p className="line-clamp-2 text-[11px] font-bold leading-4 text-[#393833]">{post.title}</p>
                  <p className="mt-1.5 text-[9px] text-[#999690]">{(post.community_comments?.length ?? 0)} respostas · {getCommunityCategory(post.category).label}</p>
                </div>
              ))}
              {trendingPosts.length === 0 ? <p className="py-3 text-[10px] text-[#8A8782]">As conversas em alta aparecerão aqui.</p> : null}
            </div>
          </section>

          <section className="rounded-xl border border-[#E1E1DD] bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-[#FF5C1A]" /><h2 className="text-xs font-extrabold">Novos membros</h2></div>
              <Link href="/community/members" className="text-[9px] font-bold text-[#D9470F] hover:underline">Ver todos</Link>
            </div>
            <div className="mt-3 space-y-3">
              {newMembers.map(member => (
                <div key={member.user_id} className="flex items-center gap-2.5">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[9px] font-black ${getAvatarTone(member.display_name)}`}>{getInitials(member.display_name)}</div>
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-extrabold text-[#34332F]">{member.display_name}</p>
                    <p className="truncate text-[8px] text-[#999690]">{member.current_role || 'Membro do Club'}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          </>}

          <p className="px-1 text-[8px] leading-4 text-[#AAA7A1]">LegalOps Club · Diretrizes · Privacidade<br />Feito para operações jurídicas melhores.</p>
        </aside>
      </div>
    </div>
  )
}
