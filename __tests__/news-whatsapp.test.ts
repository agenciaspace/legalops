// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { newsWhatsappConfig, newsWhatsappMessage, sendNewsWhatsapp } from '@/lib/news-whatsapp'
const article = { title: 'Uma nova forma de trabalhar', summary: 'O anúncio muda a entrada das demandas jurídicas e merece uma leitura com contexto.', slug: 'uma-nova-forma-de-trabalhar' }
const config = { instanceUrl: 'https://instance.example', token: 'instance-test-token', groupId: '120363000000000000@g.us' }
beforeEach(() => { vi.stubEnv('NEWS_WHATSAPP_ENABLED', 'true'); vi.stubEnv('NEWS_WHATSAPP_INSTANCE_URL', config.instanceUrl); vi.stubEnv('NEWS_WHATSAPP_INSTANCE_TOKEN', config.token); vi.stubEnv('NEWS_WHATSAPP_GROUP_ID', config.groupId) })
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })
it('requires explicit activation and this specific instance and group, without a fallback', () => {
  expect(newsWhatsappConfig()).toEqual(config)
  vi.stubEnv('NEWS_WHATSAPP_ENABLED', 'false'); expect(newsWhatsappConfig()).toBeNull()
  vi.stubEnv('NEWS_WHATSAPP_ENABLED', 'true'); vi.stubEnv('NEWS_WHATSAPP_GROUP_ID', '5511999999999'); expect(newsWhatsappConfig()).toBeNull()
  vi.stubEnv('NEWS_WHATSAPP_GROUP_ID', config.groupId); vi.stubEnv('NEWS_WHATSAPP_INSTANCE_TOKEN', ''); vi.stubEnv('CLUB_WHATSAPP_INSTANCE_TOKEN', 'another-instance'); expect(newsWhatsappConfig()).toBeNull()
})
it('formats only public article text and a canonical link, without formatting injection', () => {
  expect(newsWhatsappMessage(article)).toContain('https://legalops.news/noticias/uma-nova-forma-de-trabalhar')
  expect(newsWhatsappMessage({ ...article, title: '*Título*\nextra' })).toContain('*Título extra*')
  expect(() => newsWhatsappMessage({ ...article, slug: '//another-host' })).toThrow('invalid_article_slug')
})
it('sends to the configured announcement group with a traceable receipt', async () => {
  const sender = vi.fn().mockResolvedValue(Response.json({ messageid: 'provider-id' })); vi.stubGlobal('fetch', sender)
  expect(await sendNewsWhatsapp(config, 'delivery-id', article)).toEqual({ state: 'accepted', messageId: 'provider-id', code: null })
  const [url, options] = sender.mock.calls[0]
  expect(url).toBe('https://instance.example/send/text')
  expect(JSON.parse(options.body)).toMatchObject({ number: config.groupId, track_source: 'legalops.news', track_id: 'delivery-id', linkPreview: true, readchat: false })
  expect(options.headers).toMatchObject({ token: config.token })
})
it('does not retry an ambiguous timeout, server error, or missing receipt', async () => {
  const sender = vi.fn().mockRejectedValue(new Error('timeout')); vi.stubGlobal('fetch', sender)
  expect((await sendNewsWhatsapp(config, 'id', article)).state).toBe('uncertain')
  expect(sender).toHaveBeenCalledTimes(1)
  sender.mockResolvedValue(new Response('{}', { status: 503 })); expect((await sendNewsWhatsapp(config, 'id', article)).state).toBe('uncertain')
  sender.mockResolvedValue(Response.json({})); expect((await sendNewsWhatsapp(config, 'id', article)).state).toBe('uncertain')
  sender.mockResolvedValue(new Response('{}', { status: 401 })); expect((await sendNewsWhatsapp(config, 'id', article)).state).toBe('failed')
})
