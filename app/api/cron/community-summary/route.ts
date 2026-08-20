import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { buildDiscussionSummaryFallback, parseDiscussionSummaryResponse } from '@/lib/community-summary'
import { generateOpenCodeGoText } from '@/lib/opencode-go'

type Post = { id: string; category: string; title: string; body: string }
type Comment = { post_id: string; body: string }

export const maxDuration = 60

export async function GET(request: NextRequest) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const periodEnd = new Date()
  periodEnd.setUTCHours(0, 0, 0, 0)
  const periodStart = new Date(periodEnd)
  periodStart.setUTCDate(periodStart.getUTCDate() - 7)

  const supabase = createAdminClient()
  const [{ data: rawPosts, error: postsError }, { data: rawComments, error: commentsError }] = await Promise.all([
    supabase
      .from('community_posts')
      .select('id, category, title, body')
      .gte('created_at', periodStart.toISOString())
      .lt('created_at', periodEnd.toISOString())
      .order('created_at', { ascending: true }),
    supabase
      .from('community_comments')
      .select('post_id, body')
      .gte('created_at', periodStart.toISOString())
      .lt('created_at', periodEnd.toISOString())
      .order('created_at', { ascending: true }),
  ])

  if (postsError || commentsError) {
    return NextResponse.json({ error: postsError?.message ?? commentsError?.message }, { status: 500 })
  }

  let posts = (rawPosts ?? []) as Post[]
  const comments = (rawComments ?? []) as Comment[]
  const missingPostIds = Array.from(new Set(comments.map(comment => comment.post_id)))
    .filter(postId => !posts.some(post => post.id === postId))

  if (missingPostIds.length > 0) {
    const { data: parentPosts } = await supabase
      .from('community_posts')
      .select('id, category, title, body')
      .in('id', missingPostIds)
    posts = posts.concat((parentPosts ?? []) as Post[])
  }

  if (posts.length === 0 && comments.length === 0) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'no-discussions' })
  }

  const postById = new Map(posts.map(post => [post.id, post]))
  const sources = [
    ...posts.map(post => ({ title: post.title, body: post.body.slice(0, 1000) })),
    ...comments.map(comment => ({
      title: `Comentário em: ${postById.get(comment.post_id)?.title ?? 'discussão da comunidade'}`,
      body: comment.body.slice(0, 600),
    })),
  ]
  const sourceText = sources
    .slice(0, 80)
    .map((source, index) => `[${index + 1}] ${source.title}\n${source.body}`)
    .join('\n\n')

  let generated = buildDiscussionSummaryFallback(sources)
  let model = 'extractive-fallback'

  try {
    const response = await generateOpenCodeGoText({
      systemPrompt: 'Você é o curador do LegalOps Club. Sintetize apenas o conteúdo fornecido, preserve divergências e nunca invente pessoas, números ou conclusões.',
      userPrompt: `Crie o resumo semanal das discussões abaixo. Responda somente em JSON válido com esta estrutura: {"title":"...","summary":"...","key_points":["..."]}. Use pt-BR, uma síntese de 2 a 4 parágrafos e de 3 a 6 pontos-chave.\n\n${sourceText}`,
      maxTokens: 1400,
      temperature: 0.1,
    })
    const parsed = parseDiscussionSummaryResponse(response)
    if (parsed) {
      generated = parsed
      model = process.env.OPENCODE_GO_MODEL ?? 'deepseek-v4-flash'
    }
  } catch (error) {
    console.error('[community-summary] OpenCode Go unavailable, using extractive fallback', error)
  }

  const { error: insertError } = await supabase
    .from('community_discussion_summaries')
    .upsert({
      category: 'discussao',
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      title: generated.title,
      summary: generated.summary,
      key_points: generated.keyPoints,
      source_post_count: posts.length,
      source_comment_count: comments.length,
      model,
      visibility: 'members',
    }, { onConflict: 'category,period_start,period_end' })

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
  return NextResponse.json({ ok: true, posts: posts.length, comments: comments.length, model })
}
