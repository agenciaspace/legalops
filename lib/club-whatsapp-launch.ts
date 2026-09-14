type UazapiGroup = Record<string, unknown>

const BASE_URL = 'https://legalops.club'

function getConfig() {
  const instanceUrl = process.env.CLUB_WHATSAPP_INSTANCE_URL?.replace(/\/+$/, '')
  const token = process.env.CLUB_WHATSAPP_INSTANCE_TOKEN
  const bootstrapParticipant = process.env.CLUB_WHATSAPP_BOOTSTRAP_PARTICIPANT?.replace(/\D/g, '')
  if (!instanceUrl || !token || !bootstrapParticipant) throw new Error('WhatsApp launch is not configured.')
  return { instanceUrl, token, bootstrapParticipant }
}

async function request(path: string, body: Record<string, unknown>) {
  const { instanceUrl, token } = getConfig()
  const response = await fetch(`${instanceUrl}${path}`, {
    method: 'POST',
    headers: { token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  })
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>
  if (!response.ok) throw new Error(typeof payload.error === 'string' ? payload.error : `Uazapi failed at ${path}.`)
  return payload
}

function extractGroupJid(payload: Record<string, unknown>) {
  const group = (payload.group ?? payload) as UazapiGroup
  const value = group.JID ?? group.jid ?? group.id
  if (typeof value !== 'string' || !value.endsWith('@g.us')) throw new Error('Uazapi did not return a valid group ID.')
  return value
}

function extractInviteUrl(payload: Record<string, unknown>) {
  const group = (payload.group ?? payload) as UazapiGroup
  const code = group.InviteCode ?? group.inviteCode ?? payload.inviteCode
  if (typeof code !== 'string' || code.length < 8) throw new Error('Uazapi did not return a valid invite code.')
  return `https://chat.whatsapp.com/${code}`
}

export async function launchClubWhatsappGroup() {
  const { bootstrapParticipant } = getConfig()
  const created = await request('/group/create', { name: 'LegalOps Club — Interessados', participants: [bootstrapParticipant] })
  const groupjid = extractGroupJid(created)
  const logoUrl = `${BASE_URL}/brand/legalops-club-whatsapp.jpg`
  await request('/group/updateImage', { groupjid, image: logoUrl })
  await request('/group/updateDescription', { groupjid, description: 'Grupo oficial de interessados do LegalOps Club. Novidades, encontros e abertura de vagas para a comunidade.' })
  await request('/group/updateAnnounce', { groupjid, announce: true })
  await request('/group/updateJoinApproval', { groupjid, IsJoinApprovalRequired: true })
  await request('/group/updateMemberAddMode', { groupjid, MemberAddMode: 'admin_add' })
  const invite = await request('/group/resetInviteCode', { groupjid })
  return { groupjid, inviteUrl: extractInviteUrl(invite) }
}
