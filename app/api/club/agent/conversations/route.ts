import { NextRequest, NextResponse } from 'next/server'
import { agentSession, CONVERSATION_FIELDS } from '@/lib/club-agent-access'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  const access = await agentSession(); if (access.error) return access.error
  const page = Number(request.nextUrl.searchParams.get('page') || 0)
  if (!Number.isInteger(page) || page < 0 || page > 10000) return NextResponse.json({ error: 'Página inválida.' }, { status: 400 })
  const { data, error } = await access.supabase.from('club_agent_conversations').select(CONVERSATION_FIELDS)
    .eq('user_id', access.user.id).order('updated_at', { ascending: false }).order('id', { ascending: false }).range(page * 30, page * 30 + 30)
  if (error) return NextResponse.json({ error: 'Não conseguimos carregar as conversas.' }, { status: 503 })
  return NextResponse.json({ conversations: (data ?? []).slice(0, 30), has_more: (data?.length ?? 0) > 30, page })
}

export async function POST() {
  const access = await agentSession(); if (access.error) return access.error
  const { data, error } = await createAdminClient().from('club_agent_conversations')
    .insert({ user_id: access.user.id }).select(CONVERSATION_FIELDS).single()
  if (error || !data) return NextResponse.json({ error: 'Não conseguimos criar a conversa.' }, { status: 503 })
  return NextResponse.json({ conversation: data }, { status: 201 })
}
