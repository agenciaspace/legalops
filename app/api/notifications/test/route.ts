import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { sendNotification } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { channel } = await req.json()

  await sendNotification({
    userId: user.id,
    eventType: 'test',
    title: 'Teste de notificacao - LegalOps',
    body: `Este e um teste do canal ${channel}. Se voce recebeu esta mensagem, o canal esta configurado corretamente!`,
    url: '/settings',
  })

  return NextResponse.json({ ok: true })
}
