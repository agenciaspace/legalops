const PREFIX = '/openclm';
const ORIGIN = 'https://openclm.leonn.dev';
const PUBLIC = 'https://legalops.dev';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/collaboration') {
      if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response('WebSocket required', {status:426});
      const headers = new Headers(request.headers);
      headers.delete('cookie'); headers.delete('authorization'); headers.delete('host');
      try { return await fetch(new Request(`${ORIGIN}/collaboration`, {method:'GET',headers,redirect:'manual'})); }
      catch { return new Response('Collaboration unavailable', {status:503}); }
    }
    if (url.pathname === PREFIX || url.pathname === '/openclm.html') {
      return Response.redirect(`${PUBLIC}${PREFIX}/${url.search}`, 308);
    }
    if (!url.pathname.startsWith(`${PREFIX}/`)) return env.ASSETS.fetch(request);
    if (url.origin !== PUBLIC) return Response.redirect(`${PUBLIC}${url.pathname}${url.search}`, 308);
    const upstream = new URL(ORIGIN);
    // FastAPI root_path routes mounted static files using the prefixed ASGI path.
    upstream.pathname = url.pathname;
    upstream.search = url.search;
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.set('X-OpenCLM-Proxy', 'legalops.dev');
    headers.set('X-Forwarded-Host', 'legalops.dev');
    // Do not forward unrelated cookies from other projects on the Dev domain.
    const session = (headers.get('cookie') || '').split(';').map(item => item.trim()).filter(item => item.startsWith('openclm_session='));
    if (session.length) headers.set('cookie', session.join('; ')); else headers.delete('cookie');
    try {
      const response = await fetch(new Request(upstream, { method: request.method, headers, body: ['GET','HEAD'].includes(request.method) ? undefined : request.body, duplex: 'half', redirect: 'manual' }));
      const outgoing = new Headers(response.headers);
      outgoing.set('Cache-Control', 'no-store');
      const location = outgoing.get('location');
      if (location) {
        const target = new URL(location, upstream);
        if (target.origin === ORIGIN || target.origin === PUBLIC) {
          const path = target.pathname === PREFIX || target.pathname.startsWith(`${PREFIX}/`) ? target.pathname : `${PREFIX}${target.pathname}`;
          outgoing.set('Location', `${PUBLIC}${path}${target.search}${target.hash}`);
        }
      }
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers: outgoing });
    } catch {
      return new Response('OpenCLM temporariamente indisponível. Tente novamente em instantes.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
    }
  },
};
