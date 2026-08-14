import Link from 'next/link'
import { ArrowLeft, Check, Clock3 } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { submitEmployerJobRequest } from './actions'

const employerLabels: Record<string, string> = {
  law_firm: 'Escritório de advocacia',
  legal_department: 'Departamento jurídico',
}

export const dynamic = 'force-dynamic'

export default async function NewEmployerJobPage({ searchParams }: { searchParams?: { type?: string; saved?: string; error?: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const initialType = searchParams?.type && employerLabels[searchParams.type] ? searchParams.type : 'law_firm'
  const { data: requests } = await supabase
    .from('employer_job_requests')
    .select('id, title, organization_name, status, created_at')
    .eq('user_id', user?.id ?? '')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="mx-auto w-full max-w-[980px] px-4 py-6 sm:px-6 lg:px-8">
      <Link href="/for-employers" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6E6E69] hover:text-[#E45220]"><ArrowLeft className="h-3.5 w-3.5" /> Voltar para empresas</Link>
      <header className="mt-5">
        <h1 className="text-2xl font-bold tracking-[-0.025em] text-[#20201D]">Enviar uma vaga</h1>
        <p className="mt-1 text-sm text-[#6E6E69]">A vaga fica registrada para revisão antes da publicação.</p>
      </header>

      {searchParams?.saved ? <div className="mt-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800"><Check className="h-4 w-4" /> Vaga enviada para revisão.</div> : null}
      {searchParams?.error ? <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800">Não foi possível salvar. Revise os campos e tente novamente.</div> : null}

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <form action={submitEmployerJobRequest} className="rounded-xl border border-[#DFDFDB] bg-white p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-[#444440]">Tipo de organização
              <select name="employer_type" defaultValue={initialType} required className="mt-1.5 h-11 w-full rounded-lg border border-[#D8D8D4] bg-white px-3 text-sm outline-none focus:border-[#92928D]">
                {Object.entries(employerLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-[#444440]">Organização
              <input name="organization_name" required minLength={2} maxLength={160} className="mt-1.5 h-11 w-full rounded-lg border border-[#D8D8D4] px-3 text-sm outline-none focus:border-[#92928D]" />
            </label>
            <label className="text-xs font-semibold text-[#444440] sm:col-span-2">Cargo
              <input name="title" required minLength={3} maxLength={180} placeholder="Ex.: Legal Operations Manager" className="mt-1.5 h-11 w-full rounded-lg border border-[#D8D8D4] px-3 text-sm outline-none focus:border-[#92928D]" />
            </label>
            <label className="text-xs font-semibold text-[#444440]">Modelo de trabalho
              <select name="work_model" required defaultValue="hybrid" className="mt-1.5 h-11 w-full rounded-lg border border-[#D8D8D4] bg-white px-3 text-sm outline-none focus:border-[#92928D]"><option value="remote">Remoto</option><option value="hybrid">Híbrido</option><option value="onsite">Presencial</option></select>
            </label>
            <label className="text-xs font-semibold text-[#444440]">Localidade
              <input name="location" maxLength={160} placeholder="Cidade, estado ou país" className="mt-1.5 h-11 w-full rounded-lg border border-[#D8D8D4] px-3 text-sm outline-none focus:border-[#92928D]" />
            </label>
            <label className="text-xs font-semibold text-[#444440] sm:col-span-2">Descrição
              <textarea name="description" required minLength={30} maxLength={10000} rows={8} placeholder="Responsabilidades, experiência esperada e contexto da equipe." className="mt-1.5 w-full rounded-lg border border-[#D8D8D4] px-3 py-2.5 text-sm leading-6 outline-none focus:border-[#92928D]" />
            </label>
            <label className="text-xs font-semibold text-[#444440]">Link de candidatura
              <input name="application_url" type="url" maxLength={2048} placeholder="https://..." className="mt-1.5 h-11 w-full rounded-lg border border-[#D8D8D4] px-3 text-sm outline-none focus:border-[#92928D]" />
            </label>
            <label className="text-xs font-semibold text-[#444440]">E-mail de contato
              <input name="contact_email" type="email" required maxLength={254} defaultValue={user?.email ?? ''} className="mt-1.5 h-11 w-full rounded-lg border border-[#D8D8D4] px-3 text-sm outline-none focus:border-[#92928D]" />
            </label>
          </div>
          <div className="mt-5 flex justify-end border-t border-[#ECECE8] pt-4"><button className="rounded-md bg-[#20201D] px-4 py-2.5 text-xs font-semibold text-white hover:bg-black">Enviar para revisão</button></div>
        </form>

        <aside className="rounded-xl border border-[#DFDFDB] bg-white p-4">
          <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-[#E45220]" /><h2 className="text-xs font-bold">Envios recentes</h2></div>
          <div className="mt-3 divide-y divide-[#ECECE8]">
            {(requests ?? []).map(request => <div key={request.id} className="py-3"><p className="text-xs font-semibold text-[#30302D]">{request.title}</p><p className="mt-1 text-[10px] text-[#777772]">{request.organization_name} · {request.status === 'submitted' ? 'Em revisão' : request.status}</p></div>)}
            {(requests ?? []).length === 0 ? <p className="py-3 text-[10px] leading-4 text-[#777772]">Seus envios aparecem aqui.</p> : null}
          </div>
        </aside>
      </div>
    </div>
  )
}
