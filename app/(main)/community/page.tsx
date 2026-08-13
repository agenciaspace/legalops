import { CalendarDays, Heart, MessageCircle, Pin, Send, Sparkles } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { COMMUNITY_CATEGORIES, formatCommunityDate, getCommunityCategory, getInitials } from '@/lib/community'
import { createCommunityComment, createCommunityPost, toggleCommunityPostLike } from './actions'

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

export const dynamic = 'force-dynamic'

export default async function CommunityPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: rawPosts }, { data: rawEvent }] = await Promise.all([
    supabase
      .from('community_posts')
      .select('id, author_name, author_role, category, title, body, is_pinned, created_at, community_comments(id, author_name, body, created_at), community_post_likes(user_id)')
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
  ])

  const posts = (rawPosts ?? []) as Post[]
  const upcomingEvent = rawEvent as Event | null

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:py-8">
      <section className="min-w-0 space-y-4">
        <details className="group overflow-hidden rounded-2xl border border-[#1A1A1A]/10 bg-white shadow-sm" open={posts.length === 0}>
          <summary className="flex cursor-pointer list-none items-center gap-3 p-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FF6A00] text-sm font-black text-white">
              {getInitials(user?.email?.split('@')[0] ?? 'LO')}
            </div>
            <div className="flex-1 rounded-full bg-[#F5F4F0] px-4 py-2.5 text-sm text-[#1A1A1A]/45 transition group-open:bg-[#FF6A00]/8 group-open:text-[#C5480B]">
              Compartilhe uma pergunta, case ou descoberta…
            </div>
          </summary>
          <form action={createCommunityPost} className="space-y-3 border-t border-[#1A1A1A]/8 p-4 sm:p-5">
            <input
              name="title"
              required
              minLength={3}
              maxLength={180}
              placeholder="Título da publicação"
              className="w-full rounded-xl border border-[#1A1A1A]/15 px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/15"
            />
            <textarea
              name="body"
              required
              minLength={3}
              maxLength={10000}
              rows={4}
              placeholder="Adicione contexto para receber respostas melhores."
              className="w-full resize-y rounded-xl border border-[#1A1A1A]/15 px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/15"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <select name="category" className="rounded-xl border border-[#1A1A1A]/15 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-[#FF6A00]">
                {Object.entries(COMMUNITY_CATEGORIES).filter(([key]) => key !== 'anuncio').map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
              <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1A1A1A] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#FF6A00]">
                Publicar <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </details>

        {posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#1A1A1A]/15 bg-white/50 p-10 text-center">
            <MessageCircle className="mx-auto h-7 w-7 text-[#FF6A00]" />
            <h2 className="mt-4 font-black">Abra a primeira conversa</h2>
            <p className="mt-2 text-sm text-[#1A1A1A]/50">Compartilhe o desafio de Legal Ops que está na sua mesa hoje.</p>
          </div>
        ) : null}

        {posts.map(post => {
          const category = getCommunityCategory(post.category)
          const comments = [...(post.community_comments ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at))
          const likes = post.community_post_likes ?? []
          const likedByUser = likes.some(like => like.user_id === user?.id)

          return (
            <article key={post.id} className="rounded-2xl border border-[#1A1A1A]/10 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1A1A1A] text-xs font-black text-white">
                  {getInitials(post.author_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-black">{post.author_name}</span>
                    {post.author_role ? <span className="text-xs text-[#1A1A1A]/40">{post.author_role}</span> : null}
                  </div>
                  <p className="mt-0.5 text-[11px] text-[#1A1A1A]/40">{formatCommunityDate(post.created_at, true)}</p>
                </div>
                {post.is_pinned ? <Pin className="h-4 w-4 rotate-45 text-[#FF6A00]" aria-label="Publicação fixada" /> : null}
              </div>

              <div className="mt-4">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ${category.tone}`}>{category.label}</span>
                <h2 className="mt-3 text-lg font-black tracking-[-0.02em]">{post.title}</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#1A1A1A]/65">{post.body}</p>
              </div>

              <div className="mt-5 flex items-center gap-5 border-t border-[#1A1A1A]/8 py-3 text-xs font-bold text-[#1A1A1A]/50">
                <form action={toggleCommunityPostLike}>
                  <input type="hidden" name="post_id" value={post.id} />
                  <button className={`flex items-center gap-1.5 transition hover:text-[#FF6A00] ${likedByUser ? 'text-[#FF6A00]' : ''}`} aria-label={likedByUser ? 'Remover curtida' : 'Curtir'}>
                    <Heart className={`h-4 w-4 ${likedByUser ? 'fill-current' : ''}`} /> {likes.length}
                  </button>
                </form>
                <span className="flex items-center gap-1.5"><MessageCircle className="h-4 w-4" /> {comments.length}</span>
              </div>

              {comments.length > 0 ? (
                <div className="space-y-2 border-t border-[#1A1A1A]/8 pt-3">
                  {comments.slice(-3).map(comment => (
                    <div key={comment.id} className="rounded-xl bg-[#F5F4F0] px-3 py-2.5 text-xs leading-5">
                      <span className="font-black">{comment.author_name}</span>{' '}
                      <span className="text-[#1A1A1A]/65">{comment.body}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              <form action={createCommunityComment} className="mt-3 flex gap-2">
                <input type="hidden" name="post_id" value={post.id} />
                <input
                  name="body"
                  required
                  maxLength={3000}
                  placeholder="Escreva um comentário…"
                  aria-label={`Comentar em ${post.title}`}
                  className="min-w-0 flex-1 rounded-full border border-[#1A1A1A]/10 bg-[#F5F4F0] px-4 py-2 text-xs outline-none focus:border-[#FF6A00]"
                />
                <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1A1A1A] text-white transition hover:bg-[#FF6A00]" aria-label="Enviar comentário">
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </article>
          )
        })}
      </section>

      <aside className="space-y-4">
        {upcomingEvent ? (
          <div className="rounded-2xl bg-[#1A1A1A] p-5 text-white shadow-sm">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#FF7A45]">
              <CalendarDays className="h-4 w-4" /> Próximo encontro
            </div>
            <h2 className="mt-4 text-base font-black leading-5">{upcomingEvent.title}</h2>
            <p className="mt-3 text-xs text-white/55">{formatCommunityDate(upcomingEvent.starts_at, true)} · horário de Brasília</p>
            <a href="/community/calendar" className="mt-5 inline-flex text-xs font-black text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">Ver agenda completa</a>
          </div>
        ) : null}

        <div className="rounded-2xl border border-[#1A1A1A]/10 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#FF6A00]" />
            <h2 className="text-sm font-black">Para aproveitar bem</h2>
          </div>
          <ol className="mt-4 space-y-3 text-xs leading-5 text-[#1A1A1A]/60">
            <li><strong className="text-[#1A1A1A]">1.</strong> Dê contexto antes de pedir uma solução.</li>
            <li><strong className="text-[#1A1A1A]">2.</strong> Compartilhe o que funcionou e o que falhou.</li>
            <li><strong className="text-[#1A1A1A]">3.</strong> Preserve dados confidenciais de clientes e empresas.</li>
          </ol>
        </div>
      </aside>
    </div>
  )
}
