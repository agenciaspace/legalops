'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  FilePlus2,
  Search,
  UsersRound,
} from 'lucide-react'

type EmployerType = 'law_firm' | 'legal_department'

const employerTypes: Array<{
  value: EmployerType
  label: string
  description: string
  Icon: typeof Building2
}> = [
  {
    value: 'law_firm',
    label: 'Escritório de advocacia',
    description: 'Para equipes que atendem clientes e estruturam operações internas ou serviços de Legal Ops.',
    Icon: Building2,
  },
  {
    value: 'legal_department',
    label: 'Departamento jurídico',
    description: 'Para jurídicos internos que contratam pessoas para processos, contratos, dados e tecnologia.',
    Icon: BriefcaseBusiness,
  },
]

export function EmployerHub() {
  const [employerType, setEmployerType] = useState<EmployerType>('law_firm')
  const selected = employerTypes.find(item => item.value === employerType) ?? employerTypes[0]
  const postPath = `/employers/jobs/new?type=${employerType}`
  const peopleType = employerType === 'law_firm' ? 'law_firm' : 'legal_dept'
  const peoplePath = `/professionals?type=${peopleType}`

  return (
    <main className="mx-auto max-w-[1120px] px-5 pb-20 pt-14 sm:px-8 sm:pt-20">
      <header className="mx-auto max-w-[760px] text-center">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-[#E45220]">LEGALOPS WORK PARA EMPRESAS</p>
        <h1 className="mt-4 text-3xl font-bold tracking-[-0.035em] sm:text-5xl">Contrate para a operação jurídica</h1>
        <p className="mx-auto mt-4 max-w-[650px] text-sm leading-6 text-[#686863] sm:text-base">Escolha o tipo de organização. A partir daqui você pode enviar uma vaga para revisão ou buscar profissionais que abriram o perfil para empresas.</p>
      </header>

      <section className="mx-auto mt-10 max-w-[780px]" aria-labelledby="employer-type-title">
        <h2 id="employer-type-title" className="text-center text-xs font-semibold text-[#555550]">Qual é o seu contexto?</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {employerTypes.map(item => {
            const active = employerType === item.value
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setEmployerType(item.value)}
                aria-pressed={active}
                className={`rounded-lg border p-4 text-left transition ${active ? 'border-[#20201D] bg-white shadow-sm' : 'border-[#DEDEDA] bg-[#FAFAF8] hover:border-[#BDBDB8]'}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-md ${active ? 'bg-[#20201D] text-white' : 'bg-[#ECECE8] text-[#666661]'}`}><item.Icon className="h-4 w-4" /></span>
                  <span className="text-sm font-semibold text-[#20201D]">{item.label}</span>
                </div>
                <p className="mt-3 text-xs leading-5 text-[#6E6E69]">{item.description}</p>
              </button>
            )
          })}
        </div>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2">
        <article className="overflow-hidden rounded-lg border border-[#DFDFDB] bg-white">
          <div className="border-b border-[#E4E4E0] bg-[#F0F0ED] p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-[0.16em] text-[#E45220]">ANUNCIAR</span>
              <FilePlus2 className="h-5 w-5 text-[#53534F]" />
            </div>
            <h2 className="mt-10 text-2xl font-black tracking-[-0.04em]">Publique uma vaga</h2>
          </div>
          <div className="p-5">
            <p className="text-sm leading-6 text-[#666661]">Envie cargo, descrição, modelo de trabalho e link de candidatura. A equipe recebe o pedido com o contexto de {selected.label.toLocaleLowerCase('pt-BR')}.</p>
            <Link href={`/login?next=${encodeURIComponent(postPath)}`} className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#20201D] px-4 py-2.5 text-xs font-semibold text-white hover:bg-black">
              Enviar vaga <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </article>

        <article className="overflow-hidden rounded-lg border border-[#DFDFDB] bg-white">
          <div className="border-b border-[#E4E4E0] bg-[#F0F0ED] p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-[0.16em] text-[#E45220]">ENCONTRAR</span>
              <UsersRound className="h-5 w-5 text-[#53534F]" />
            </div>
            <h2 className="mt-10 text-2xl font-black tracking-[-0.04em]">Busque pessoas</h2>
          </div>
          <div className="p-5">
            <p className="text-sm leading-6 text-[#666661]">Abra o diretório com o filtro de {selected.label.toLocaleLowerCase('pt-BR')}. A busca usa cargo, experiência, competências e ferramentas informadas pelos membros.</p>
            <Link href={`/login?next=${encodeURIComponent(peoplePath)}`} className="mt-5 inline-flex items-center gap-2 rounded-md border border-[#CFCFCA] bg-white px-4 py-2.5 text-xs font-semibold text-[#20201D] hover:bg-[#F5F5F2]">
              <Search className="h-3.5 w-3.5" /> Abrir diretório
            </Link>
          </div>
        </article>
      </section>
    </main>
  )
}
