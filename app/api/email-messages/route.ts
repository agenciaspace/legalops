import { NextRequest, NextResponse } from 'next/server'
import {
  buildHtmlEmail,
  getBrevoSenderIdentity,
  sendBrevoTransactionalEmail,
} from '@/lib/brevo'
import { getUserEmailAlias, listUserEmailMessages } from '@/lib/email-alias-store'
import { parseEmailAddressList, validateOutboundEmailDraft } from '@/lib/email-messages'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const messages = await listUserEmailMessages(supabase, user.id)
  return NextResponse.json({ messages })
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const aliasId = typeof body?.aliasId === 'string' ? body.aliasId : ''
  const to = typeof body?.to === 'string' ? body.to : ''
  const subject = typeof body?.subject === 'string' ? body.subject : ''
  const messageBody = typeof body?.body === 'string' ? body.body : ''

  const validationError = validateOutboundEmailDraft({
    to,
    subject,
    body: messageBody,
  })

  if (!aliasId) {
    return NextResponse.json({ error: 'Alias is required.' }, { status: 400 })
  }

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const alias = await getUserEmailAlias(supabase, user.id, aliasId)

  if (!alias) {
    return NextResponse.json({ error: 'Email alias not found.' }, { status: 404 })
  }

  if (alias.status !== 'active') {
    return NextResponse.json(
      { error: 'Only active email aliases can send new messages.' },
      { status: 400 }
    )
  }

  const recipients = parseEmailAddressList(to)
  const sender = getBrevoSenderIdentity()
  const htmlBody = buildHtmlEmail(messageBody)

  try {
    const result = await sendBrevoTransactionalEmail({
      to: recipients,
      subject: subject.trim(),
      textBody: messageBody.trim(),
      htmlBody,
      replyTo: alias.address,
      headers: {
        'X-LegalOps-Alias': alias.address,
        'X-LegalOps-Alias-Id': alias.id,
      },
    })

    const { data: message, error } = await supabase
      .from('email_messages')
      .insert({
        user_id: user.id,
        alias_id: alias.id,
        provider: 'brevo',
        provider_message_id: result.messageId,
        direction: 'outbound',
        status: 'sent',
        from_name: sender.name,
        from_address: sender.email,
        reply_to_address: alias.address,
        to_addresses: recipients,
        subject: subject.trim(),
        text_body: messageBody.trim(),
        html_body: htmlBody,
        headers: {
          'X-LegalOps-Alias': alias.address,
          'X-LegalOps-Alias-Id': alias.id,
        },
        provider_payload: result.payload,
        sent_at: new Date().toISOString(),
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      {
        message: {
          ...message,
          alias,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send email.'

    await supabase.from('email_messages').insert({
      user_id: user.id,
      alias_id: alias.id,
      provider: 'brevo',
      direction: 'outbound',
      status: 'failed',
      from_name: sender.name,
      from_address: sender.email,
      reply_to_address: alias.address,
      to_addresses: recipients,
      subject: subject.trim(),
      text_body: messageBody.trim(),
      html_body: htmlBody,
      error_message: errorMessage,
      sent_at: new Date().toISOString(),
    })

    return NextResponse.json({ error: errorMessage }, { status: 502 })
  }
}
