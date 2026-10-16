export default {
  async scheduled(event, env, ctx) {
    const path = event.cron === '0 12 * * *' ? '/api/cron/news-discovery'
      : event.cron === '* * * * *' ? '/api/cron/club-translations'
      : event.cron === '0 21 * * 0'
      ? '/api/cron/community-summary'
      : '/api/cron/scrape'

    const paths = path === '/api/cron/scrape' ? [path, '/api/cron/club-pro-notices'] : [path]
    ctx.waitUntil(Promise.all(paths.map(taskPath => fetch(`${env.APP_ORIGIN}${taskPath}`, {
      headers: {
        authorization: `Bearer ${env.CRON_SECRET}`,
      },
    }))))
    if (event.cron === '* * * * *' && new Date(event.scheduledTime).getUTCMinutes() % 5 === 0) {
      ctx.waitUntil(fetch(`${env.APP_ORIGIN}/api/cron/news-subscriptions`, {
        headers: { authorization: `Bearer ${env.CRON_SECRET}` },
      }))
    }
  },
}
