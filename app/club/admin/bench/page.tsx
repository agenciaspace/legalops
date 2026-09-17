import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { isLegalOpsAdminEmail } from '@/lib/legalops-admin'
import { BENCH_TYPES, BENCH_CRITERIA, BENCH_EVIDENCE, BENCH_RELATIONSHIPS, type BenchContent } from '@/lib/bench-contributions'
import { reviewBenchContribution } from './actions'

export const dynamic = 'force-dynamic'
const inputClass = 'mt-2 block min-h-11 w-full rounded border border-[#CEC8BD] bg-white px-3 py-2 text-sm'
function Select({ name, label, options, value }: { name: string; label: string; options: Record<string, string>; value: string }) {
  return <label className="block text-sm">{label}<select className={inputClass} name={name} defaultValue={value}>{Object.entries(options).map(([key, text]) => <option value={key} key={key}>{text}</option>)}</select></label>
}
export default async function BenchReviewPage({ searchParams }: { searchParams?: { error?: string; saved?: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=%2Fclub%2Fadmin%2Fbench')
  if (!isLegalOpsAdminEmail(user.email)) redirect('/community')
  const admin = createAdminClient()
  const [pending, published] = await Promise.all([
    admin.from('bench_contribution_submissions').select('id,content,contact_email,created_at').eq('status', 'pending').order('created_at').limit(50),
    admin.from('bench_contribution_publications').select('id,content,published_at').eq('is_public', true).order('published_at', { ascending: false }).limit(50),
  ])
  return <main className="mx-auto max-w-5xl px-5 py-12 text-[#111]">
    <Link href="https://legalops.dev/bench/" className="text-sm underline">Abrir Bench público</Link>
    <h1 className="mt-6 text-4xl font-semibold">Revisão do Bench</h1>
    <p className="mt-4 text-sm leading-7 text-[#69635E]">Confira fonte, contexto, vínculo e autorização. Remova informações confidenciais da versão pública. Publicar uma contribuição não muda automaticamente as notas da calculadora.</p>
    {searchParams?.error && <p role="alert" className="mt-5 text-red-700">Não foi possível concluir. Confira os campos, a confirmação de revisão e se a contribuição ainda está pendente.</p>}
    {searchParams?.saved && <p role="status" className="mt-5 text-green-800">Revisão registrada.</p>}
    {(pending.error || published.error) && <p role="alert" className="mt-5 text-red-700">Falha ao consultar a fila. Recarregue antes de revisar.</p>}
    <h2 className="mt-10 text-2xl font-semibold">Pendentes · {pending.data?.length || 0}</h2>
    {!pending.error && !pending.data?.length && <p className="mt-4 text-sm">Nenhuma contribuição aguardando revisão.</p>}
    {(pending.data || []).map(row => {
      const content = row.content as BenchContent
      return <section key={row.id} className="mt-6 border border-[#CEC8BD] bg-[#FAF7F1] p-6">
        <h3 className="text-xl font-semibold">{content.title}</h3><p className="mt-2 text-xs text-[#69635E]">Contato privado: {row.contact_email} · {new Date(row.created_at).toLocaleDateString('pt-BR')} · {row.id}</p>
        <details className="my-4 text-xs"><summary className="cursor-pointer">Ver texto original preservado</summary><pre className="mt-3 whitespace-pre-wrap break-words">{JSON.stringify(content, null, 2)}</pre></details>
        <form action={reviewBenchContribution} className="mt-5 space-y-4">
          <input type="hidden" name="id" value={row.id} />
          <div className="grid gap-4 sm:grid-cols-2"><Select name="kind" label="Tipo" options={BENCH_TYPES} value={content.kind} /><Select name="evidence_kind" label="Base da afirmação" options={BENCH_EVIDENCE} value={content.evidence_kind} /><Select name="criterion" label="Critério" options={BENCH_CRITERIA} value={content.criterion} /><Select name="relationship" label="Vínculo declarado" options={BENCH_RELATIONSHIPS} value={content.relationship} /></div>
          {([['tool_name', 'Ferramenta ou tema', 100], ['tool_url', 'Site da ferramenta', 1000], ['title', 'Título público', 140], ['source_url', 'Fonte pública', 1000], ['public_name', 'Nome público informado', 80], ['observed_on', 'Data da observação (AAAA-MM-DD)', 10]] as const).map(([name, label, max]) => <label key={name} className="block text-sm">{label}<input className={inputClass} name={name} maxLength={max} defaultValue={content[name]} /></label>)}
          <label className="block text-sm">Texto público<textarea className={inputClass} name="body" rows={5} maxLength={3000} defaultValue={content.body} /></label>
          <label className="block text-sm">Contexto público<textarea className={inputClass} name="context" rows={3} maxLength={700} defaultValue={content.context} /></label>
          <label className="block text-sm">Nota da revisão (pública ao aprovar)<textarea className={inputClass} name="review_note" minLength={10} maxLength={700} required rows={2} /></label>
          <label className="flex gap-3 text-sm"><input type="checkbox" name="verified" />Conferi a fonte e o contexto; revisei o conteúdo para publicação, sem dados confidenciais.</label>
          <div className="flex flex-wrap gap-4"><button className="min-h-11 rounded bg-[#111] px-5 text-sm font-semibold text-white" name="decision" value="approve">Publicar versão revisada</button><button className="min-h-11 px-4 text-sm underline" name="decision" value="reject">Não publicar</button></div>
        </form>
      </section>
    })}
    <h2 className="mt-12 text-2xl font-semibold">Publicações recentes</h2>
    {(published.data || []).map(row => <details key={row.id} className="mt-5 border-t border-[#CEC8BD] pt-4"><summary className="cursor-pointer font-semibold">{(row.content as BenchContent).title}</summary><form action={reviewBenchContribution} className="mt-4 space-y-3"><input type="hidden" name="id" value={row.id} /><label className="block text-sm">Motivo da retirada<textarea className={inputClass} name="review_note" required minLength={10} maxLength={700} /></label><button className="min-h-11 text-sm text-red-700 underline" name="decision" value="withdraw">Retirar do público e preservar histórico</button></form></details>)}
  </main>
}
