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
    description: 'Para escritórios que estão estruturando inovação, Legal Ops, gestão, conhecimento, tecnologia ou novas formas de entregar serviços jurídicos.',
    Icon: Building2,
  },
  {
    value: 'legal_department',
    label: 'Departamento jurídico',
    description: 'Para jurídicos internos que contratam pessoas para contratos, Legal Ops, dados, tecnologia, fornecedores, projetos e gestão da operação.',
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
    <main className="mx-auto max-w-[1120px] px-5 pb-20 pt-14 sm:px-8 sm:pt-20" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
      <header className="mx-auto max-w-[780px] text-center">
        <p className="text-[11px] font-bold tracking-[0.18em] text-[#C9684F]">LEGALOPS WORK PARA EMPRESAS</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl" style={{ fontFamily: 'var(--font-quicksand), ui-rounded, sans-serif' }}>Contrate quem faz o jurídico funcionar melhor</h1>
        <p className="mx-auto mt-4 max-w-[690px] text-sm leading-6 text-[#69635E] sm:text-base">Publique vagas de Legal Ops, Legal Tech, contratos, dados, operações, inovação e gestão jurídica — ou encontre profissionais que abriram o perfil para empresas.</p>
      </header>

      <section className="mx-auto mt-10 max-w-[780px]" aria-labelledby="employer-type-title">
        <h2 id="employer-type-title" className="text-center text-xs font-bold text-[#66615B]">Qual é o seu contexto?</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {employerTypes.map(item => {
            const active = employerType === item.value
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setEmployerType(item.value)}
                aria-pressed={active}
                className={`rounded-2xl border p-4 text-left transition ${active ? 'border-[#111111] bg-white shadow-sm' : 'border-[#CEC8BD] bg-[#FAF7F1] hover:border-[#AFA79D]'}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full ${active ? 'bg-[#111111] text-white' : 'bg-[#F0EAE1] text-[#66615B]'}`}><item.Icon className="h-4 w-4" /></span>
                  <span className="text-sm font-semibold text-[#111111]">{item.label}</span>
                </div>
                <p className="mt-3 text-xs leading-5 text-[#69635E]">{item.description}</p>
              </button>
            )
          })}
        </div>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2">
        <article className="overflow-hidden rounded-[24px] border border-[#CEC8BD] bg-white shadow-[0_8px_30px_rgba(17,17,17,0.035)]">
          <div className="border-b border-[#E6DED0] bg-[#111111] p-5 text-white">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-[0.16em] text-[#E88A6A]">ANUNCIAR</span>
              <FilePlus2 className="h-5 w-5 text-[#E88A6A]" />
            </div>
            <h2 className="mt-10 text-2xl font-semibold tracking-[-0.04em]" style={{ fontFamily: 'var(--font-quicksand), ui-rounded, sans-serif' }}>Publique uma vaga jurídica</h2>
          </div>
          <div className="p-5">
            <p className="text-sm leading-6 text-[#69635E]">Envie cargo, escopo, senioridade, modelo de trabalho, remuneração quando disponível e link de candidatura. A vaga chega ao público já dentro do contexto de {selected.label.toLocaleLowerCase('pt-BR')}.</p>
            <Link href={`/login?next=${encodeURIComponent(postPath)}`} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#111111] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#2A2927]">
              Enviar vaga <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </article>

        <article className="overflow-hidden rounded-[24px] border border-[#CEC8BD] bg-white shadow-[0_8px_30px_rgba(17,17,17,0.035)]">
          <div className="border-b border-[#E6DED0] bg-[#FAF7F1] p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-[0.16em] text-[#C9684F]">ENCONTRAR</span>
              <UsersRound className="h-5 w-5 text-[#C9684F]" />
            </div>
            <h2 className="mt-10 text-2xl font-semibold tracking-[-0.04em]" style={{ fontFamily: 'var(--font-quicksand), ui-rounded, sans-serif' }}>Encontre profissionais do jurídico</h2>
          </div>
          <div className="p-5">
            <p className="text-sm leading-6 text-[#69635E]">Busque por cargo, experiência, competências, ferramentas e frentes como Legal Ops, CLM, Legal Tech, contratos, dados e gestão — respeitando a visibilidade escolhida por cada membro.</p>
            <Link href={`/login?next=${encodeURIComponent(peoplePath)}`} className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#CEC8BD] bg-white px-4 py-2.5 text-xs font-bold text-[#111111] hover:bg-[#FAF7F1]">
              <Search className="h-3.5 w-3.5" /> Abrir diretório
            </Link>
          </div>
        </article>
      </section>
    </main>
  )
}
