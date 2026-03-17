import Link from 'next/link'
import { ArrowRight, Briefcase, Building2 } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-stone-50 text-slate-950">
      <header className="border-b border-stone-200 bg-stone-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/">
            <BrandLogo
              className="flex items-center gap-3"
              markClassName="h-10 w-10 text-slate-950"
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/for-employers"
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-950"
            >
              Para Empresas
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
        {/* Hero */}
        <div className="text-center">
          <h1
            className="text-4xl sm:text-5xl"
            style={{
              fontFamily:
                '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
            }}
          >
            Planos e preços
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Soluções para profissionais que querem acelerar a carreira e empresas que buscam os melhores talentos.
          </p>
        </div>

        {/* Two paths */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* Professionals */}
          <Link
            href="/pricing/professionals"
            className="group relative flex flex-col rounded-2xl border border-stone-200 bg-white p-8 transition-all hover:border-slate-950 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
              <Briefcase className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold">Para Profissionais</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Ferramentas de IA para entrevistas e cover letters, pipeline visual de candidaturas,
              email aliases profissionais e posicionamento no diretório.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-slate-500">
              <li>Free — $0/mês</li>
              <li>Pro — $29/mês</li>
              <li>Expert — $99/mês</li>
            </ul>
            <div className="mt-6 flex items-center gap-2 text-sm font-medium text-slate-950 group-hover:gap-3 transition-all">
              Ver planos para profissionais
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>

          {/* Employers */}
          <Link
            href="/pricing/employers"
            className="group relative flex flex-col rounded-2xl border border-stone-200 bg-white p-8 transition-all hover:border-slate-950 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <Building2 className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold">Para Empresas</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Publique vagas, acesse o pool de talentos especializados, match automático com IA,
              filtros avançados e integração com ATS.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-slate-500">
              <li>Job Post — $299/vaga</li>
              <li>Talent Access — $999/mês</li>
              <li>Enterprise — Custom</li>
            </ul>
            <div className="mt-6 flex items-center gap-2 text-sm font-medium text-slate-950 group-hover:gap-3 transition-all">
              Ver planos para empresas
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        </div>

        {/* CTA */}
        <section className="mt-16 rounded-2xl border border-stone-200 bg-white px-6 py-8 text-center sm:px-8">
          <h2
            className="text-3xl"
            style={{
              fontFamily:
                '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
            }}
          >
            Comece grátis. Evolua quando quiser.
          </h2>
          <p className="mt-3 text-slate-600">
            Sem compromisso. Cancele a qualquer momento.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            Criar conta grátis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    </div>
  )
}
