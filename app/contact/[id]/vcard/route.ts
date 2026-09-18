import { readContactCard } from '@/lib/contact-card-server'
import { vcard } from '@/lib/contact-card'
export const dynamic = 'force-dynamic'
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const result = await readContactCard(params.id)
  if (!result.card) return new Response('Contato indisponível. Entre na comunidade para acessar.', { status: result.status, headers: {'Cache-Control':'private, no-store'} })
  return new Response(vcard(result.card), { headers: { 'Content-Type': 'text/vcard; charset=utf-8', 'Content-Disposition': 'attachment; filename="contato-legalops.vcf"', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } })
}
