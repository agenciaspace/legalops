import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const { entryId } = await params
  const supabase = await createServerSupabaseClient()

  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('entry_id', entryId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contacts: contacts ?? [] })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const { entryId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const { data: contact, error } = await supabase
    .from('contacts')
    .insert({
      entry_id: entryId,
      user_id: user.id,
      name: body.name,
      role: body.role || null,
      email: body.email || null,
      linkedin_url: body.linkedin_url || null,
      phone: body.phone || null,
      notes: body.notes || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contact }, { status: 201 })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  await params
  const supabase = await createServerSupabaseClient()
  const url = new URL(req.url)
  const contactId = url.searchParams.get('id')

  if (!contactId) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
