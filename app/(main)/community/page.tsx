import { TranslatedContent } from '@/components/community/TranslatedContent'
import { loadClubTranslations } from '@/lib/club-translations'
import { getClubLocale, getClubTranslator, getClubTimezone } from '@/lib/club-locale-server'
import Link from 'next/link'
import { EventShare } from '@/components/community/EventShare'
import { CalendarDays, Heart, Lock, MessageCircle, Pin, Send } from 'lucide-react'
import { MemberAvatar } from '@/components/community/MemberAvatar'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { COMMUNITY_CATEGORIES, formatCommunityDate, getCommunityCategory, hasActiveClubAccess } from '@/lib/community'
import { correctCommunitySourceLocale, createCommunityComment, createCommunityPost, createCommunitySubtopic, toggleCommunityPostLike } from './actions'

type Post = {id:string;author_id:string|null;author_name:string;author_role:string|null;category:string;title:string;body:string;is_pinned:boolean;created_at:string;community_comments:{id:string;author_id?:string;author_name:string;body:string;created_at:string}[];community_post_likes:{user_id:string}[]}
export const dynamic = 'force-dynamic'
export default async function CommunityPage({searchParams}:{searchParams?:{space?:string;q?:string;count?:string;post?:string}}) {
 const t = getClubTranslator()
 const locale = getClubLocale()

 const supabase=await createServerSupabaseClient()
 const {data:{user}}=await supabase.auth.getUser()
 const {data:access}=await supabase.from('community_members').select('club_access_status,club_access_expires_at').eq('user_id',user?.id??'').maybeSingle()
 const hasCommunityAccess=hasActiveClubAccess(access)
 const search=(searchParams?.q??'').trim().slice(0,80)
 const selectedSpace=searchParams?.space && COMMUNITY_CATEGORIES[searchParams.space] ? searchParams.space : null
 const take=Math.min(300,Math.max(3,Math.floor(Number(searchParams?.count)||3)))
 let query=supabase.from('community_posts').select('id,author_id,author_name,author_role,category,title,body,is_pinned,created_at,community_comments(id,author_id,author_name,body,created_at),community_post_likes(user_id)')
 if(searchParams?.post && /^[0-9a-f-]{36}$/i.test(searchParams.post))query=query.eq('id',searchParams.post)
 if(search) { const {data:matches}=await supabase.rpc('search_club_posts',{search_text:search,target_locale:locale,category_filter:selectedSpace});query=query.in('id',matches?.length?matches.map((row:{id:string})=>row.id):['00000000-0000-0000-0000-000000000000']) }
 if(selectedSpace)query=query.eq('category',selectedSpace)
 const {data:rawPosts}=await query.order('created_at',{ascending:false}).order('id',{ascending:false}).limit(take+1)
 const posts=((rawPosts??[]) as Post[]).slice(0,take)
 const more=(rawPosts?.length??0)>take && take<300
 const authorIds=Array.from(new Set(posts.map(p=>p.author_id).filter((id):id is string=>Boolean(id))))
 const {data:authors}=authorIds.length ? await supabase.from('community_members').select('user_id,display_name,current_role,organization_name,organization_description,avatar_path').in('user_id',authorIds) : {data:[]}
 const authorById=new Map((authors??[]).map(a=>[a.user_id,a]))
 const {data:feedEvents}=await supabase.from('community_events').select('id,slug,title,description,host_name,starts_at,location_label,event_type').eq('is_published',true).order('starts_at',{ascending:false}).limit(10)
 const {data:subtopics}=selectedSpace ? await supabase.from('community_forum_topics').select('id,title,description,created_at').eq('category',selectedSpace).eq('status','active').order('created_at',{ascending:false}).limit(20) : {data:[]}
 const translations=await loadClubTranslations(supabase,[...posts.map(p=>p.id),...posts.flatMap(p=>p.community_comments.map(c=>c.id)),...authorIds,...(feedEvents??[]).map(e=>e.id),...(subtopics??[]).map(s=>s.id)])
 const content=(kind:string,id:string,original:Record<string,string|null>,compact=false)=><TranslatedContent key={`${kind}:${id}:${locale}`} source={translations.sources.get(`${kind}:${id}`)} original={original} enabled={translations.enabled} serverLocale={locale} compact={compact}/>
 const sourceLanguage=(kind:'post'|'comment',id:string)=><details className="mt-2 text-xs text-[#69635E]"><summary className="inline-flex min-h-11 cursor-pointer items-center">{t('Idioma do texto')}</summary><form action={correctCommunitySourceLocale} className="flex flex-wrap gap-2"><input type="hidden" name="id" value={id}/><input type="hidden" name="kind" value={kind}/><select aria-label={t('Idioma do texto')} name="source_locale" defaultValue={translations.sources.get(`${kind}:${id}`)?.locale_hint??''} className="min-h-11 rounded-lg border bg-white px-2"><option value="">{t('Detectar automaticamente')}</option><option value="pt-BR">Português</option><option value="en">English</option><option value="es">Español</option></select><button className="min-h-11 px-3 underline">{t('Salvar')}</button></form></details>
 const next=new URLSearchParams({count:String(take+3)});if(search)next.set('q',search);if(selectedSpace)next.set('space',selectedSpace)
 return <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
  <header className="mb-5"><h1 className="text-2xl font-semibold tracking-tight">{t("Comunidade")}</h1></header>
  {hasCommunityAccess ? <details id="new-post" className="mb-6 rounded-2xl border border-[#CEC8BD] bg-white">
   <summary className="min-h-14 cursor-pointer list-none rounded-2xl bg-[#24231F] px-5 py-4 text-center text-sm font-semibold text-white">{t("Compartilhar com a comunidade")}</summary>
   <form action={createCommunityPost} className="space-y-4 p-5">
    <label className="block text-sm font-medium">{t("Título")}<input name="title" required minLength={3} maxLength={180} className="mt-2 min-h-12 w-full rounded-xl border p-3 text-base" /></label>
    <label className="block text-sm font-medium">{t("Sua publicação")}<textarea name="body" required minLength={3} maxLength={10000} rows={4} className="mt-2 w-full rounded-xl border p-3 text-base" /></label>
    <label className="block text-sm font-medium">{t("Assunto")}<span id="post-category-help" className="mt-1 block text-xs font-normal leading-5 text-[#625E59]">{t("Escolha um dos temas no menu abaixo para organizar sua publicação.")}</span><select aria-describedby="post-category-help" name="category" defaultValue={selectedSpace??'discussao'} className="mt-2 min-h-12 w-full rounded-xl border bg-white p-3 text-base">{Object.entries(COMMUNITY_CATEGORIES).filter(([key])=>key!=='anuncio').map(([key,value])=><option key={key} value={key}>{t(value.label)}</option>)}</select></label>
    <label className="block text-sm">{t("Idioma do texto")}<select name="source_locale" defaultValue="" className="ml-2 min-h-11 rounded-lg border bg-white px-2"><option value="">{t("Detectar automaticamente")}</option><option value="pt-BR">{t("Português")}</option><option value="en">{t("English")}</option><option value="es">{t("Español")}</option></select></label>
    <button className="min-h-12 rounded-xl bg-[#24231F] px-5 text-sm font-semibold text-white">{t("Publicar")}</button>
   </form>
  </details> : <Link href="/club/entrar" className="mb-6 inline-flex min-h-12 items-center underline">{t("Completar perfil para participar")}</Link>}
  <details id="community-search" open={Boolean(search||selectedSpace)} className="mb-5 text-sm">
   <summary className="inline-flex min-h-11 cursor-pointer items-center text-[#625E59]">{t("Buscar ou filtrar publicações")}</summary>
   <form action="/community" className="mt-2 grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2">
    <input name="q" defaultValue={search} aria-label={t("Buscar publicações")} placeholder={t("Buscar publicações")} maxLength={80} className="min-h-12 min-w-0 rounded-lg border px-3 text-base" />
    <select name="space" aria-label={t("Filtrar por assunto")} defaultValue={selectedSpace??''} className="min-h-12 min-w-0 rounded-lg border bg-white px-3 text-base"><option value="">{t("Todos os assuntos")}</option>{Object.entries(COMMUNITY_CATEGORIES).map(([key,c])=><option key={key} value={key}>{t(c.label)}</option>)}</select>
    <button className="min-h-12 rounded-lg bg-[#24231F] px-4 font-semibold text-white">{t("Buscar")}</button>{search||selectedSpace?<Link href="/community" className="inline-flex min-h-12 items-center">{t("Limpar filtros")}</Link>:null}
   </form>
  </details>
  {selectedSpace && hasCommunityAccess ? <details className="mb-5 overflow-hidden rounded-2xl border border-[#D9D4CA] bg-white shadow-sm"><summary className="cursor-pointer list-none px-5 py-4 text-sm font-bold text-[#24231F] marker:hidden"><span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF0E9] text-[#D9470F]">＋</span>{t("Criar subtema em")} {t(COMMUNITY_CATEGORIES[selectedSpace].label)}</summary><form action={createCommunitySubtopic} className="space-y-4 border-t border-[#ECECE8] bg-[#FAF7F1] p-5"><input type="hidden" name="category" value={selectedSpace} /><div><label className="text-[10px] font-black uppercase tracking-[0.12em] text-[#77746E]">{t("Nome do subtema")}</label><input name="title" required minLength={3} maxLength={160} placeholder={t("Ex.: intake para contratos estratégicos")} className="mt-2 min-h-11 w-full rounded-xl border border-[#D8D3C9] bg-white px-3 text-sm outline-none focus:border-[#D9470F]" /></div><div><label className="text-[10px] font-black uppercase tracking-[0.12em] text-[#77746E]">{t("Objetivo da conversa")}</label><textarea name="description" maxLength={1000} rows={3} placeholder={t("O que vamos discutir?")} className="mt-2 w-full rounded-xl border border-[#D8D3C9] bg-white p-3 text-sm outline-none focus:border-[#D9470F]" /></div><button className="min-h-11 rounded-xl bg-[#24231F] px-5 text-sm font-bold text-white">{t("Criar subtema")}</button></form></details> : null}
  {selectedSpace && subtopics?.length ? <section className="mb-5 rounded-xl border border-[#E1E1DD] bg-white p-4"><h2 className="text-sm font-bold">{t("Subtemas do fórum")}</h2><div className="mt-3 grid gap-2 sm:grid-cols-2">{subtopics.map(topic => <div key={topic.id} className="rounded-lg bg-[#F7F7F5] p-3">{content('topic',topic.id,{title:topic.title,description:topic.description},true)}</div>)}</div></section> : null}
  {posts.length===0 && !(feedEvents?.length) ? <p className="py-8 text-sm leading-6 text-[#625E59]">{search||selectedSpace?t("Nenhuma publicação encontrada."):t("Ainda não há publicações. Compartilhe uma pergunta ou experiência para começar.")}</p> : null}
  <div className="space-y-4">
   {(feedEvents ?? []).map(event => <article key={`event-${event.id}`} className="rounded-xl border border-[#FFD8C8] bg-[#FFF8F4] p-4 sm:p-5">
    <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFE3D7] text-[#D9470F]"><CalendarDays className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#D9470F]">{t("Registro de evento")}</p>{content('event',event.id,{title:event.title,description:event.description,location_label:event.location_label})}<p className="mt-2 text-xs font-semibold text-[#88857F]">{new Intl.DateTimeFormat(getClubLocale(),{dateStyle:'medium',timeStyle:'short',timeZone:getClubTimezone()}).format(new Date(event.starts_at))} · {getClubTimezone()}</p><Link href={`/community/events/${event.slug}`} className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-[#24231F] px-4 text-xs font-bold text-white">{t("Ver evento →")}</Link><div className="mt-2"><EventShare slug={event.slug} title={event.title} /></div></div></div>
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
                      <p className="mt-1 text-sm font-medium text-[#48443E]">{author?.organization_name || t("Membro do Club")}</p>
                      {author ? content('member',author.user_id,{current_role:author.current_role,organization_description:author.organization_description},true) : null}
                      <p className="mt-0.5 flex items-center gap-1.5 text-[9px] text-[#9A9791]">
                        {new Intl.DateTimeFormat(locale,{dateStyle:'short',timeStyle:'short',timeZone:getClubTimezone()}).format(new Date(post.created_at))}
                        <span>·</span>
                        <span>{t(category.label)}</span>
                      </p>
                    </div>
                    {post.is_pinned ? <Pin className="h-3.5 w-3.5 rotate-45 text-[#FF5C1A]" aria-label={t("Publicação fixada")} /> : null}

                  </div>

                  <div className="mt-4 pl-0 sm:pl-[52px]">
                    {post.is_pinned ? <span className="mb-2 inline-flex rounded-md bg-[#FFF0E9] px-2 py-0.5 text-[8px] font-black uppercase tracking-wide text-[#D9470F]">{t("Fixado")}</span> : null}
                    {content('post',post.id,{title:post.title,body:post.body})}
                    {post.author_id === user?.id && sourceLanguage('post',post.id)}
                  </div>

                  {hasCommunityAccess ? <div className="mt-5 flex items-center gap-4 border-t border-[#ECECE8] pb-0 pt-3 text-[10px] font-bold text-[#77746E] sm:ml-[52px]">
                    <form action={toggleCommunityPostLike}>
                      <input type="hidden" name="post_id" value={post.id} />
                      <button className={`flex items-center gap-1.5 rounded-md px-1 py-1 transition hover:text-[#D9470F] ${likedByUser ? 'text-[#D9470F]' : ''}`} aria-label={likedByUser ? t("Remover curtida") : t("Curtir")}>
                        <Heart className={`h-4 w-4 ${likedByUser ? 'fill-current' : ''}`} /> {likes.length || t("Curtir")}
                      </button>
                    </form>
                    <span className="flex items-center gap-1.5"><MessageCircle className="h-4 w-4" /> {comments.length || t("Comentar")}</span>
                  </div> : (
                    <div className="mt-5 flex items-center gap-2 border-t border-[#ECECE8] pt-3 text-[10px] font-bold text-[#9A9791] sm:ml-[52px]">
                      <Lock className="h-3.5 w-3.5" /> {t("Interações disponíveis para membros do Club")} </div>
                  )}

                  {hasCommunityAccess && comments.length > 0 ? (
                    <div className="mt-3 space-y-2 border-t border-[#ECECE8] pt-3 sm:ml-[52px]">
                      {comments.slice(-3).map(comment => (
                        <div key={comment.id} className="flex gap-2 rounded-lg bg-[#F7F7F5] px-3 py-2.5 text-[11px] leading-5">
                          <span className="font-extrabold text-[#292824]">{comment.author_name}</span>
                          {content('comment',comment.id,{body:comment.body},true)}
                          {comment.author_id === user?.id && sourceLanguage('comment',comment.id)}
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
                      placeholder={t("Escreva um comentário…")}
                      aria-label={t("Comentar")}
                      className="min-w-0 flex-1 rounded-lg border border-[#E4E3DF] bg-[#FAFAF8] px-3 py-2 text-[11px] outline-none focus:border-[#FFB99E] focus:bg-white"
                    />
                    <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#292825] text-white transition hover:bg-[#FF5C1A]" aria-label={t("Enviar comentário")}>
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </form> : null}
                </article>
              )
            })}
  </div>
  {more?<Link href={`/community?${next}`} scroll={false} className="mt-6 flex min-h-12 items-center justify-center rounded-xl border border-[#CEC8BD] bg-white px-5 text-sm font-semibold">{t("Ver mais publicações")}</Link>:null}
 </div>
}
