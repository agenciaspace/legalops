import PostalMime from 'postal-mime'

export default {
  async email(message, env) {
    const parser = new PostalMime()
    const parsed = await parser.parse(await new Response(message.raw).arrayBuffer())
    const headers = Object.fromEntries(
      (parsed.headers ?? []).map(header => [header.key, header.value])
    )
    const sentAt = parsed.date instanceof Date
      ? parsed.date.toISOString()
      : parsed.date ?? null

    const response = await fetch(env.INBOUND_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.WEBHOOK_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        MessageId: parsed.messageId ?? message.headers.get('message-id'),
        From: {
          Address: parsed.from?.address ?? message.from,
          Name: parsed.from?.name ?? null,
        },
        To: (parsed.to ?? [{ address: message.to }]).map(recipient => ({
          Address: recipient.address,
          Name: recipient.name ?? null,
        })),
        Cc: (parsed.cc ?? []).map(recipient => ({
          Address: recipient.address,
          Name: recipient.name ?? null,
        })),
        Subject: parsed.subject ?? null,
        RawTextBody: parsed.text ?? null,
        RawHtmlBody: parsed.html ?? null,
        SentAtDate: sentAt,
        Headers: headers,
      }),
    })

    if (!response.ok) {
      throw new Error(`Inbound webhook failed with HTTP ${response.status}`)
    }
  },
}
