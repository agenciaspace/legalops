const UPSTREAM_ORIGIN = 'https://legalops.work'

export default {
  async fetch(request) {
    const publicUrl = new URL(request.url)
    const upstreamPath = publicUrl.pathname === '/' ? '/club' : publicUrl.pathname
    const upstreamUrl = new URL(upstreamPath, UPSTREAM_ORIGIN)
    upstreamUrl.search = publicUrl.search

    const requestHeaders = new Headers(request.headers)
    requestHeaders.delete('host')
    requestHeaders.set('x-forwarded-host', publicUrl.host)
    requestHeaders.set('x-forwarded-proto', publicUrl.protocol.replace(':', ''))

    const upstreamRequest = new Request(upstreamUrl, {
      method: request.method,
      headers: requestHeaders,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      redirect: 'manual',
    })

    const upstreamResponse = await fetch(upstreamRequest)
    const responseHeaders = new Headers(upstreamResponse.headers)
    const location = responseHeaders.get('location')

    if (location) {
      const redirectUrl = new URL(location, upstreamUrl)
      const upstreamHost = new URL(UPSTREAM_ORIGIN).hostname
      if (redirectUrl.hostname === upstreamHost || redirectUrl.hostname.endsWith('.vercel.app')) {
        redirectUrl.protocol = publicUrl.protocol
        redirectUrl.host = publicUrl.host
        responseHeaders.set('location', redirectUrl.toString())
      }
    }

    responseHeaders.set('x-legalops-edge', 'cloudflare')

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    })
  },
}
