// Run with the existing deployment identity. Never print or persist its token.
const accountId = '3d40d7797b3fd6d1cd2644eefea9e907'
const domain = 'legalops.chat'
const service = 'legalops-chat'
const token = process.env.CLOUDFLARE_API_TOKEN
if (!token) throw new Error('Cloudflare deployment identity is not configured.')

async function api(path, method = 'GET', body) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  })
  const data = await response.json()
  if (!response.ok || !data.success) {
    throw new Error(`Cloudflare ${method} ${path.split('?')[0]}: ${response.status}; ${(data.errors ?? []).map(error => `${error.code}: ${error.message}`).join('; ')}`)
  }
  return data.result
}

const zones = await api(`/zones?name=${domain}&account.id=${accountId}`)
const zone = zones[0] ?? await api('/zones', 'POST', { name: domain, account: { id: accountId }, type: 'full' })
if (zone.account.id !== accountId || zone.name !== domain) throw new Error('Unexpected zone identity.')
console.log('CHAT_DOMAIN_ZONE', JSON.stringify({ id: zone.id, name: zone.name, status: zone.status, nameservers: zone.name_servers }))
const attached = await api(`/accounts/${accountId}/workers/domains`)
for (const hostname of [domain, `www.${domain}`]) {
  const current = attached.find(item => item.hostname === hostname)
  if (current && current.service !== service) throw new Error(`${hostname} already belongs to another Worker; leaving it unchanged.`)
  try {
    const result = current ?? await api(`/accounts/${accountId}/workers/domains`, 'PUT', { hostname, service, enabled: true, zone_id: zone.id, zone_name: domain })
    console.log('CHAT_DOMAIN_ROUTE', JSON.stringify({ hostname: result.hostname, service: result.service, enabled: result.enabled }))
  } catch (error) {
    if (zone.status === 'active') throw error
    console.log(`CHAT_DOMAIN_PENDING ${hostname}: zone is ${zone.status}. Connect the assigned nameservers, then rerun this workflow. ${error.message}`)
  }
}
