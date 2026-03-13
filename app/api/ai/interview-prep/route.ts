import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { generateKimiText } from '@/lib/kimi'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { entry_id } = await req.json()
  if (!entry_id) return NextResponse.json({ error: 'entry_id required' }, { status: 400 })

  const { data: entry } = await supabase
    .from('user_pipeline_entries')
    .select('*, job:jobs(*)')
    .eq('id', entry_id)
    .eq('user_id', user.id)
    .single()

  if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 })

  const job = entry.job as { title: string; company: string; raw_description: string; benefits: string[] }

  try {
    const text = await generateKimiText({
      systemPrompt: 'You are an expert career coach specializing in Legal Operations roles. Return practical Portuguese (BR) interview preparation in clean markdown.',
      userPrompt: `Based on this job posting, generate interview preparation materials in Portuguese (BR).

Job Title: ${job.title}
Company: ${job.company}
Description: ${job.raw_description.slice(0, 3000)}

Please provide:
1. **5 perguntas tecnicas** que provavelmente serao feitas nesta entrevista, com dicas de como responder cada uma
2. **3 perguntas comportamentais** comuns para este tipo de vaga, com sugestoes de historias STAR para usar
3. **3 perguntas para voce fazer ao entrevistador** que demonstram interesse genuino e conhecimento da area
4. **Pontos-chave sobre a empresa** que voce deve pesquisar antes da entrevista
5. **Red flags** para ficar atento durante o processo

Format your response in clean markdown.`,
      maxTokens: 2000,
      temperature: 0.4,
    })

    return NextResponse.json({ prep: text })
  } catch (error) {
    console.error('[ai/interview-prep] Kimi request failed:', error)

    const status =
      error instanceof Error && error.message.includes('KIMI_API_KEY')
        ? 503
        : 502

    return NextResponse.json(
      { error: 'Failed to generate interview preparation.' },
      { status }
    )
  }
}
