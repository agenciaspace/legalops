import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { hasActiveClubAccess, COMMUNITY_CATEGORIES } from '@/lib/community'
import { hasClubProAccess } from '@/lib/club-membership'
import { generateOpenRouterText } from '@/lib/openrouter'
import { AgentSource, AgentTurn, OPENCLM_AGENT_SOURCE, personalAgentPrompt, rankAgentSources } from '@/lib/club-personal-agent'
import { isPublishableJobRecord } from '@/lib/job-publication'
export const maxDuration=60
async function session() {
  const supabase=await createServerSupabaseClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user) return {error:NextResponse.json({error:'Entre na sua conta.'},{status:401})} as const
  const {data:member}=await supabase.from('community_members').select('club_access_status,club_access_expires_at,club_pro_status,club_pro_expires_at').eq('user_id',user.id).maybeSingle()
  if(!hasActiveClubAccess(member)||!hasClubProAccess(member)) return {error:NextResponse.json({error:'Este recurso faz parte do Club Pro.'},{status:403})} as const
  return {supabase,user} as const
}
export async function GET(request:NextRequest) {
  const access=await session();if(access.error)return access.error
  const {supabase,user}=access
  const page=Number(request?.nextUrl.searchParams.get('page')||0)
  if(!Number.isInteger(page)||page<0||page>10000)return NextResponse.json({error:'Página inválida.'},{status:400})
  const [turns,preferences,usage]=await Promise.all([
    supabase.from('club_agent_turns').select('id,question,answer,sources,status,created_at').eq('user_id',user.id).eq('status','completed').order('created_at',{ascending:false}).order('id',{ascending:false}).range(page*30,page*30+30),
    supabase.from('club_agent_preferences').select('focus,topics').eq('user_id',user.id).maybeSingle(),
    supabase.from('club_agent_usage').select('used').eq('user_id',user.id).eq('day',new Date().toISOString().slice(0,10)).maybeSingle(),
  ])
  if(turns.error||preferences.error||usage.error)return NextResponse.json({error:'Não conseguimos carregar seu agente.'},{status:503})
  return NextResponse.json({turns:(turns.data??[]).slice(0,30).reverse(),has_more:(turns.data?.length??0)>30,page,preferences:preferences.data??{focus:'',topics:[]},used:usage.data?.used??0})
}
export async function PATCH(request:NextRequest) {
  const access=await session();if(access.error)return access.error
  const body=await request.json().catch(()=>null)
  if(typeof body?.focus!=='string'||body.focus.length>2000||!Array.isArray(body.topics)||body.topics.length>12||body.topics.some((topic:unknown)=>typeof topic!=='string'||!COMMUNITY_CATEGORIES[topic])) return NextResponse.json({error:'Confira o contexto e os assuntos escolhidos.'},{status:400})
  const {error}=await access.supabase.from('club_agent_preferences').upsert({user_id:access.user.id,focus:body.focus.trim(),topics:Array.from(new Set(body.topics)),updated_at:new Date().toISOString()})
  return error?NextResponse.json({error:'Não conseguimos salvar suas preferências.'},{status:503}):NextResponse.json({ok:true})
}
export async function DELETE() {
  const access=await session();if(access.error)return access.error
  // Usage is stored separately, so deleting history cannot reset the daily limit.
  const {error}=await createAdminClient().from('club_agent_turns').delete().eq('user_id',access.user.id).neq('status','pending')
  return error?NextResponse.json({error:'Não conseguimos apagar o histórico.'},{status:503}):NextResponse.json({ok:true})
}
export async function POST(request:NextRequest) {
  const access=await session();if(access.error)return access.error
  const body=await request.json().catch(()=>null)
  const question=typeof body?.question==='string'?body.question.trim():''
  if(question.length<3||question.length>2000)return NextResponse.json({error:'Escreva uma pergunta de 3 a 2.000 caracteres.'},{status:400})
  const {supabase,user}=access
  const admin=createAdminClient()
  const {data:turnId,error:reservationError}=await admin.rpc('reserve_club_agent_turn',{member_id:user.id,question_text:question})
  if(reservationError||!turnId) {
    const message=reservationError?.message??''
    return NextResponse.json({error:message.includes('DAILY_LIMIT')?'Você chegou às 30 perguntas de hoje. O limite renova às 21h de Brasília (00h UTC).':message.includes('QUESTION_IN_PROGRESS')?'Aguarde a resposta anterior antes de perguntar novamente.':'Não conseguimos iniciar a conversa. Confira seu acesso Pro.'},{status:message.includes('DAILY_LIMIT')||message.includes('QUESTION_IN_PROGRESS')?429:503})
  }
  try {
    const results=await Promise.all([
      supabase.from('account_profiles').select('full_name,current_role,organization_name,organization_description,public_bio,areas_of_expertise,desired_roles').eq('user_id',user.id).maybeSingle(),
      supabase.from('club_agent_preferences').select('focus,topics').eq('user_id',user.id).maybeSingle(),
      supabase.from('club_agent_turns').select('id,question,answer,sources,status,created_at').eq('user_id',user.id).eq('status','completed').order('created_at',{ascending:false}).limit(8),
      supabase.from('community_posts').select('id,title,body,category,created_at,community_comments(body,created_at)').order('created_at',{ascending:false}).limit(50),
      supabase.from('community_discussion_summaries').select('title,summary,period_start,period_end').order('period_end',{ascending:false}).limit(4),
      supabase.from('community_events').select('id,title,description,starts_at,ends_at,location_label').eq('is_published',true).gte('starts_at',new Date(Date.now()-30*86400000).toISOString()).order('starts_at',{ascending:false}).limit(12),
      supabase.from('community_posts').select('id,title,created_at').eq('author_id',user.id).order('created_at',{ascending:false}).limit(10),
      supabase.from('community_comments').select('post_id,body,created_at').eq('author_id',user.id).order('created_at',{ascending:false}).limit(10),
      supabase.from('community_post_likes').select('post_id,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(10),
      supabase.from('jobs').select('id,title,company,raw_description,url,url_status,url_checked_at,company_logo_url').eq('url_status','live').eq('enrichment_status','done').not('url_checked_at','is',null).limit(50),
    ])
    if(results.some(result=>result.error))throw new Error('Could not read authorized agent context')
    const [profile,preferences,history,posts,summaries,events,ownPosts,ownComments,ownLikes,jobs]=results
    const prefs=preferences.data??{focus:'',topics:[]}
    const activity={posts:ownPosts.data??[],comments:(ownComments.data??[]).map(c=>({...c,body:c.body.slice(0,500)})),likes:ownLikes.data??[],scope:'Últimos 10 registros de cada tipo do próprio usuário. Não há rastreamento de páginas lidas ou de última visita.'}
    const sources:AgentSource[]=[
      ...(events.data??[]).map(event=>({kind:'club' as const,title:`Encontro: ${event.title}`,url:'https://legalops.club/community/calendar#bench',content:`Bench e eventos da comunidade. Início: ${event.starts_at}. Fim: ${event.ends_at??'não informado'}. Local: ${event.location_label}. ${event.description?.slice(0,1200)??''}`})),
      {kind:'dev',title:'Bench de CLM da comunidade',url:'https://legalops.dev/bench/',content:'Catálogo próprio e aberto de ferramentas de gestão contratual, com avaliação em três passos: necessidade, ferramentas e avaliação. Cada empresa escolhe seus pesos e valida capacidades no piloto. Não indica compatibilidade automaticamente nem comprova integrações sem evidência.'},
      ...(posts.data??[]).map(post=>({kind:'club' as const,title:post.title,url:`https://legalops.club/community?post=${post.id}#post-${post.id}`,content:`Publicado em ${post.created_at}. ${post.body.slice(0,650)} Comentários: ${(post.community_comments??[]).slice(-2).map(comment=>comment.body.slice(0,200)).join(" / ")}`})),
      ...(summaries.data??[]).map(summary=>({kind:'club' as const,title:summary.title,url:'https://legalops.club/community/summaries',content:`Período: ${summary.period_start} a ${summary.period_end}. ${summary.summary}`})),
      ...(jobs.data??[]).filter(job=>isPublishableJobRecord({url:job.url,urlStatus:job.url_status,companyLogoUrl:job.company_logo_url})).map(job=>({kind:'work' as const,title:`${job.title} — ${job.company}`,url:job.url,content:(job.raw_description??'').slice(0,1600)})),
      {kind:'dev',title:'Playbook contratual aberto',url:'https://legalops.dev/playbook/',content:'Projeto comunitário open source com editor de posições, exceções e aprovações. Rascunhos ficam no navegador, podem ser exportados e propostos no GitHub. A biblioteca ainda não tem posições aprovadas. Não é uma política jurídica pronta.'},
      OPENCLM_AGENT_SOURCE,
    ]
    const selected=rankAgentSources(sources,question,[...(profile.data?.areas_of_expertise??[]),profile.data?.current_role??'',profile.data?.organization_description??'',prefs.focus,...prefs.topics.map((topic:string)=>COMMUNITY_CATEGORIES[topic]?.label??topic)])
    const prompt=personalAgentPrompt({profile:profile.data,focus:prefs.focus,topics:prefs.topics,history:[...(history.data??[])].reverse() as AgentTurn[],sources:selected,question,activity,currentPage:typeof body.page==='string'&&/^\/community(?:\/[^?#]*)?$/.test(body.page)?body.page.slice(0,150):'/community'})
    const answer=await generateOpenRouterText({...prompt,maxTokens:1400,temperature:0.2,timeoutMs:35000})
    if(!answer.trim())throw new Error('Empty agent response')
    const sourceLinks=selected.map(({title,url,kind})=>({title,url,kind}))
    const {error:saveError}=await admin.rpc('finish_club_agent_turn',{turn_id:turnId,answer_text:answer,source_links:sourceLinks,failed:false})
    if(saveError)throw new Error('Could not save agent response')
    return NextResponse.json({turn:{id:turnId,question,answer,sources:sourceLinks,status:'completed',created_at:new Date().toISOString()}})
  } catch(error) {
    console.error('[club/agent] request failed:',error)
    await admin.rpc('finish_club_agent_turn',{turn_id:turnId,answer_text:null,source_links:[],failed:true})
    return NextResponse.json({error:'O agente não conseguiu responder agora. Tente novamente em alguns instantes.'},{status:503})
  }
}
