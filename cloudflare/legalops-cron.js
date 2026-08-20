export default {
  async scheduled(event, env, ctx) {
    const path = event.cron === '0 21 * * 0'
      ? '/api/cron/community-summary'
      : '/api/cron/scrape'

    ctx.waitUntil(fetch(`${env.APP_ORIGIN}${path}`, {
      headers: {
        authorization: `Bearer ${env.CRON_SECRET}`,
      },
    }))
  },
}
