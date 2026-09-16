import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { isLegalOpsAdminEmail } from '@/lib/legalops-admin'
import { PRO_RECEIPT_BUCKET, proPrice } from '@/lib/club-pro'
import { reviewProOrder, configureProOffer } from './actions'
export const dynamic='force-dynamic'
export default async function ProAdmin({searchParams}:{searchParams?:{error?:string;saved?:string}}) {
  const supabase=await createServerSupabaseClient();const {data:{user}}=await supabase.auth.getUser()
  if(!user||!isLegalOpsAdminEmail(user.email)) redirect('/community')
  const admin=createAdminClient()
  const {data:offer}=await admin.from('club_pro_offer').select('price_cents,period_months,active').eq('id',true).single()
  const {data:orders}=await admin.from('club_pro_orders').select('*').eq('status','submitted').order('created_at')
  const rows=await Promise.all((orders??[]).map(async order=>{
    const [{data:member},{data:receipt},{data:buyer}]=await Promise.all([
      admin.from('community_members').select('display_name,linkedin_url').eq('user_id',order.user_id).maybeSingle(),
      order.receipt_path ? admin.storage.from(PRO_RECEIPT_BUCKET).createSignedUrl(order.receipt_path,300,{download:true}) : Promise.resolve({data:null}),
      admin.auth.admin.getUserById(order.user_id),
    ])
    return {...order,member,buyerEmail:buyer.user?.email,receiptUrl:receipt?.signedUrl}
  }))
  return <main className="mx-auto max-w-4xl p-5 py-10 text-[#111]"><Link href="/community" className="text-sm underline">Voltar à comunidade</Link><h1 className="mt-6 text-3xl font-semibold">Pagamentos do Pro</h1><p className="mt-3 text-sm text-[#69635E]">Confira o crédito no banco antes de ativar. O comprovante, sozinho, não confirma o recebimento.</p>
    {searchParams?.error&&<p role="alert" className="mt-4 text-red-700">Confira o pedido, marque a conferência bancária ou informe um motivo com ao menos 10 caracteres.</p>}{searchParams?.saved&&<p className="mt-4 text-green-700">Pedido atualizado.</p>}
    <details className="mt-6 rounded-xl border border-[#CEC8BD] bg-white p-5"><summary className="cursor-pointer font-semibold">Preço e abertura das vendas</summary><form action={configureProOffer} className="mt-4 space-y-4"><label className="block text-sm">Preço em reais<input name="price" required inputMode="decimal" defaultValue={offer?.price_cents ? (offer.price_cents/100).toFixed(2) : ''} placeholder="Valor do plano" className="mt-2 block rounded border p-3"/></label><label className="block text-sm">Período<select name="period_months" required defaultValue={offer?.period_months??''} className="mt-2 block rounded border p-3"><option value="" disabled>Escolha o período</option><option value="1">1 mês</option><option value="12">12 meses</option></select></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={offer?.active??false}/>Abrir vendas com esse preço</label><p className="text-xs leading-5 text-[#69635E]">Pedidos já abertos preservam o valor original. PIX para leonhatori@gmail.com; conferência e ativação manuais.</p><button className="min-h-11 rounded bg-[#111] px-4 text-sm font-semibold text-white">Salvar oferta</button></form></details>
    {!rows.length&&<p className="mt-8">Nenhum comprovante aguardando conferência.</p>}
    {rows.map(order=><section key={order.id} className="mt-6 rounded-xl border border-[#CEC8BD] bg-white p-5"><h2 className="font-semibold">{order.member?.display_name??order.user_id} · {proPrice(order.price_cents)}</h2><p className="mt-2 text-xs">{order.buyerEmail} · Pedido {order.id} · {order.period_months} mês(es)</p>{order.receiptUrl&&<a className="mt-3 inline-block text-sm font-semibold underline" href={order.receiptUrl}>Baixar comprovante (link válido por 5 minutos)</a>}<form action={reviewProOrder} className="mt-5 space-y-4"><input type="hidden" name="order_id" value={order.id}/><label className="flex items-start gap-2 text-sm"><input type="checkbox" name="verified" className="mt-1"/>Conferi no banco o recebimento do valor deste pedido.</label><button name="decision" value="approve" className="rounded-lg bg-[#111] px-4 py-3 text-sm font-semibold text-white">Confirmar pagamento e ativar Pro</button><label className="block text-sm">Motivo, se não aprovado<textarea name="note" maxLength={1000} className="mt-2 block w-full rounded border p-3"/></label><button name="decision" value="reject" className="text-sm text-red-700 underline">Não aprovar e informar motivo</button></form></section>)}
  </main>
}
