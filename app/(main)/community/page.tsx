import Link from 'next/link'
import { EventShare } from '@/components/community/EventShare'
import { CalendarDays, Heart, Lock, MessageCircle, Pin, Send } from 'lucide-react'
import { MemberAvatar } from '@/components/community/MemberAvatar'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { COMMUNITY_CATEGORIES, formatCommunityDate, getCommunityCategory, hasActiveClubAccess } from '@/lib/community'
import { createCommunityComment, createCommunityPost, createCommunitySubtopic, toggleCommunityPostLike } from './actions'

type Post = {id:string;author_id:string|null;author_name:string;author_role:string|null;category:string;title:string;body:string;is_pinned:boolean;created_at:string;community_comments:{id:string;author_name:string;body:string;created_at:string}[];community_post_likes:{user_id:string}[]}
export const dynamic = 'force-dynamic'
export default async function CommunityPage({searchParams}:{searchParams?:{space?:string;q?:string;count?:string;post?:string}}) {
 const supabase=await createServerSupabaseClient()
 const {data:{user}}=await supabase.auth.getUser()
 const {data:access}=await supabase.from('community_members').select('club_access_status,club_access_expires_at').eq('user_id',user?.id??'').maybeSingle()
 const hasCommunityAccess=hasActiveClubAccess(access)
 const search=(searchParams?.q??'').replace(/[^a-zA-Z0-9À-ÿ\s-]/g,' ').trim().slice(0,80)
 const selectedSpace=searchParams?.space && COMMUNITY_CATEGORIES[searchParams.space] ? searchParams.space : null
 const take=Math.min(300,Math.max(3,Math.floor(Number(searchParams?.count)||3)))
 let query=supabase.from('community_posts').select('id,author_id,author_name,author_role,category,title,body,is_pinned,created_at,community_comments(id,author_name,body,created_at),community_post_likes(user_id)')
 if(searchParams?.post && /^[0-9a-f-]{36}$/i.test(searchParams.post))query=query.eq('id',searchParams.post)
 if(search)query=query.or(`title.ilike.%${search}%,body.ilike.%${search}%`)
 if(selectedSpace)query=query.eq('category',selectedSpace)
 const {data:rawPosts}=await query.order('created_at',{ascending:false}).order('id',{ascending:false}).limit(take+1)
 const posts=((rawPosts??[]) as Post[]).slice(0,take)
 const more=(rawPosts?.length??0)>take && take<300
 const authorIds=Array.from(new Set(posts.map(p=>p.author_id).filter((id):id is string=>Boolean(id))))
 const {data:authors}=authorIds.length ? await supabase.from('community_members').select('user_id,display_name,current_role,organization_name,organization_description,avatar_path').in('user_id',authorIds) : {data:[]}
 const authorById=new Map((authors??[]).map(a=>[a.user_id,a]))
 const {data:feedEvents}=await supabase.from('community_events').select('id,slug,title,description,host_name,starts_at,location_label,event_type').eq('is_published',true).order('starts_at',{ascending:false}).limit(10)
 const {data:subtopics}=selectedSpace ? await supabase.from('community_forum_topics').select('id,title,description,created_at').eq('category',selectedSpace).eq('status','active').order('created_at',{ascending:false}).limit(20) : {data:[]}
 const next=new URLSearchParams({count:String(take+3)});if(search)next.set('q',search);if(selectedSpace)next.set('space',selectedSpace)
 return <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
  <header className="mb-5"><h1 className="text-2xl font-semibold tracking-tight">Comunidade</h1></header>
  {hasCommunityAccess ? <details id="new-post" className="mb-6 rounded-2xl border border-[#CEC8BD] bg-white">
   <summary className="min-h-14 cursor-pointer list-none rounded-2xl bg-[#24231F] px-5 py-4 text-center text-sm font-semibold text-white">Compartilhar com a comunidade</summary>
   <form action={createCommunityPost} className="space-y-4 p-5">
    <label className="block text-sm font-medium">Título<input name="title" required minLength={3} maxLength={180} className="mt-2 min-h-12 w-full rounded-xl border p-3 text-base" /></label>
    <label className="block text-sm font-medium">Sua publicação<textarea name="body" required minLength={3} maxLength={10000} rows={4} className="mt-2 w-full rounded-xl border p-3 text-base" /></label>
    <label className="block text-sm font-medium">Assunto<span id="post-category-help" className="mt-1 block text-xs font-normal leading-5 text-[#625E59]">Escolha um dos temas no menu abaixo para organizar sua publicação.</span><select aria-describedby="post-category-help" name="category" defaultValue={selectedSpace??'discussao'} className="mt-2 min-h-12 w-full rounded-xl border bg-white p-3 text-base">{Object.entries(COMMUNITY_CATEGORIES).filter(([key])=>key!=='anuncio').map(([key,value])=><option key={key} value={key}>{value.label}</option>)}</select></label>
    <button className="min-h-12 rounded-xl bg-[#24231F] px-5 text-sm font-semibold text-white">Publicar</button>
   </form>
  </details> : <Link href="/club/entrar" className="mb-6 inline-flex min-h-12 items-center underline">Completar perfil para participar</Link>}
  <details id="community-search" open={Boolean(search||selectedSpace)} className="mb-5 text-sm">
   <summary className="inline-flex min-h-11 cursor-pointer items-center text-[#625E59]">Buscar ou filtrar publicações</summary>
   <form action="/community" className="mt-2 grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2">
    <input name="q" defaultValue={search} aria-label="Buscar publicações" placeholder="Buscar publicações" maxLength={80} className="min-h-12 min-w-0 rounded-lg border px-3 text-base" />
    <select name="space" aria-label="Filtrar por assunto" defaultValue={selectedSpace??''} className="min-h-12 min-w-0 rounded-lg border bg-white px-3 text-base"><option value="">Todos os assuntos</option>{Object.entries(COMMUNITY_CATEGORIES).map(([key,c])=><option key={key} value={key}>{c.label}</option>)}</select>
    <button className="min-h-12 rounded-lg bg-[#24231F] px-4 font-semibold text-white">Buscar</button>{search||selectedSpace?<Link href="/community" className="inline-flex min-h-12 items-center">Limpar filtros</Link>:null}
   </form>
  </details>
  {selectedSpace && hasCommunityAccess ? <details className="mb-5 overflow-hidden rounded-2xl border border-[#D9D4CA] bg-white shadow-sm"><summary className="cursor-pointer list-none px-5 py-4 text-sm font-bold text-[#24231F] marker:hidden"><span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF0E9] text-[#D9470F]">＋</span>Criar subtema em {COMMUNITY_CATEGORIES[selectedSpace].label}</summary><form action={createCommunitySubtopic} className="space-y-4 border-t border-[#ECECE8] bg-[#FAF7F1] p-5"><input type="hidden" name="category" value={selectedSpace} /><div><label className="text-[10px] font-black uppercase tracking-[0.12em] text-[#77746E]">Nome do subtema</label><input name="title" required minLength={3} maxLength={160} placeholder="Ex.: intake para contratos estratégicos" className="mt-2 min-h-11 w-full rounded-xl border border-[#D8D3C9] bg-white px-3 text-sm outline-none focus:border-[#D9470F]" /></div><div><label className="text-[10px] font-black uppercase tracking-[0.12em] text-[#77746E]">Objetivo da conversa</label><textarea name="description" maxLength={1000} rows={3} placeholder="O que vamos discutir?" className="mt-2 w-full rounded-xl border border-[#D8D3C9] bg-white p-3 text-sm outline-none focus:border-[#D9470F]" /></div><button className="min-h-11 rounded-xl bg-[#24231F] px-5 text-sm font-bold text-white">Criar subtema</button></form></details> : null}
  {selectedSpace && subtopics?.length ? <section className="mb-5 rounded-xl border border-[#E1E1DD] bg-white p-4"><h2 className="text-sm font-bold">Subtemas do fórum</h2><div className="mt-3 grid gap-2 sm:grid-cols-2">{subtopics.map(topic => <div key={topic.id} className="rounded-lg bg-[#F7F7F5] p-3"><p className="text-sm font-semibold">{topic.title}</p>{topic.description ? <p className="mt-1 text-xs text-[#716B65]">{topic.description}</p> : null}</div>)}</div></section> : null}
  {posts.length===0 && !(feedEvents?.length) ? <p className="py-8 text-sm leading-6 text-[#625E59]">{search||selectedSpace?'Nenhuma publicação encontrada.':'Ainda não há publicações. Compartilhe uma pergunta ou experiência para começar.'}</p> : null}
  <div className="space-y-4">
   {(feedEvents ?? []).map(event => <article key={`event-${event.id}`} className="rounded-xl border border-[#FFD8C8] bg-[#FFF8F4] p-4 sm:p-5">
    <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFE3D7] text-[#D9470F]"><CalendarDays className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#D9470F]">Registro de evento</p><h2 className="mt-1 text-[17px] font-extrabold leading-6 tracking-[-0.015em] text-[#252420]">{event.title}</h2><p className="mt-2 text-[13px] leading-[1.65] text-[#68655F]">{event.description}</p><p className="mt-2 text-xs font-semibold text-[#88857F]">{new Intl.DateTimeFormat('pt-BR',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(new Date(event.starts_at))} · {event.location_label}</p><Link href={`/community/events/${event.slug}`} className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-[#24231F] px-4 text-xs font-bold text-white">Ver evento →</Link><div className="mt-2"><EventShare slug={event.slug} title={event.title} /></div></div></div>
   </article>)}
            {posts.map(post => {
              const author = post.author_id ? authorById.get(post.author_id) : null
              const authorName = author?.display_name || post.author_name
              const category = getCommunityCategory(post.category)
              const comments = [...(post.community_comments ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at))
              const likes = post.community_post_likes ?? []
              const likedByUser = likes.some(like => like.user_id === user?.id)

              return (
                <article id={`post-${post.id}`} key={post.id} className="rounded-xl border border-[#E1E1DD] bg-white p-4 transition hover:border-[#D2D1CC] sm:p-5">
                  <div className="flex items-start gap-3">
                    <MemberAvatar userId={post.author_id} path={author?.avatar_path} name={authorName} />
                    <div className="min-w-0 flex-1">
                      {post.author_id ? <Link href={`/community/members/${post.author_id}`} className="text-base font-semibold text-[#24231F] underline-offset-4 hover:underline">{authorName}</Link> : <span className="text-base font-semibold">{authorName}</span>}
                      <p className="mt-1 text-sm font-medium text-[#48443E]">{author?.current_role || post.author_role || 'Membro do Club'}{author?.organization_name ? ` · ${author.organization_name}` : ''}</p>
                      {author?.organization_description ? <p className="mt-2 whitespace-pre-wrap rounded-lg bg-[#F5F1E8] px-3 py-2 text-sm leading-6 text-[#625E59]">{author.organization_description}</p> : null}
                      <p className="mt-0.5 flex items-center gap-1.5 text-[9px] text-[#9A9791]">
                        {formatCommunityDate(post.created_at, true)}
                        <span>·</span>
                        <span>{category.label}</span>
                      </p>
                    </div>
                    {post.is_pinned ? <Pin className="h-3.5 w-3.5 rotate-45 text-[#FF5C1A]" aria-label="Publicação fixada" /> : null}

                  </div>

                  <div className="mt-4 pl-0 sm:pl-[52px]">
                    {post.is_pinned ? <span className="mb-2 inline-flex rounded-md bg-[#FFF0E9] px-2 py-0.5 text-[8px] font-black uppercase tracking-wide text-[#D9470F]">Fixado</span> : null}
                    <h2 className="text-[17px] font-extrabold leading-6 tracking-[-0.015em] text-[#252420]">{post.title}</h2>
                    <p className="mt-2 whitespace-pre-wrap text-[13px] leading-[1.65] text-[#68655F]">{post.body}</p>
                  </div>

                  {hasCommunityAccess ? <div className="mt-5 flex items-center gap-4 border-t border-[#ECECE8] pb-0 pt-3 text-[10px] font-bold text-[#77746E] sm:ml-[52px]">
                    <form action={toggleCommunityPostLike}>
                      <input type="hidden" name="post_id" value={post.id} />
                      <button className={`flex items-center gap-1.5 rounded-md px-1 py-1 transition hover:text-[#D9470F] ${likedByUser ? 'text-[#D9470F]' : ''}`} aria-label={likedByUser ? 'Remover curtida' : 'Curtir'}>
                        <Heart className={`h-4 w-4 ${likedByUser ? 'fill-current' : ''}`} /> {likes.length || 'Curtir'}
                      </button>
                    </form>
                    <span className="flex items-center gap-1.5"><MessageCircle className="h-4 w-4" /> {comments.length || 'Comentar'}</span>
                  </div> : (
                    <div className="mt-5 flex items-center gap-2 border-t border-[#ECECE8] pt-3 text-[10px] font-bold text-[#9A9791] sm:ml-[52px]">
                      <Lock className="h-3.5 w-3.5" /> Interações disponíveis para membros do Club
                    </div>
                  )}

                  {hasCommunityAccess && comments.length > 0 ? (
                    <div className="mt-3 space-y-2 border-t border-[#ECECE8] pt-3 sm:ml-[52px]">
                      {comments.slice(-3).map(comment => (
                        <div key={comment.id} className="flex gap-2 rounded-lg bg-[#F7F7F5] px-3 py-2.5 text-[11px] leading-5">
                          <span className="font-extrabold text-[#292824]">{comment.author_name}</span>
                          <span className="text-[#68655F]">{comment.body}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {hasCommunityAccess ? <form action={createCommunityComment} className="mt-3 flex gap-2 sm:ml-[52px]">
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
  {more?<Link href={`/community?${next}`} scroll={false} className="mt-6 flex min-h-12 items-center justify-center rounded-xl border border-[#CEC8BD] bg-white px-5 text-sm font-semibold">Ver mais publicações</Link>:null}
 </div>
}
