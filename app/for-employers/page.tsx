import Link from 'next/link'
import { ArrowRight, Users, Zap, BarChart3, Shield, Search, Target } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'

const features = [
  {
    icon: Target,
    title: 'Match automático com IA',
    description:
      'Nosso algoritmo analisa skills, experiência e preferências para conectar você aos candidatos ideais.',
  },
  {
    icon: Users,
    title: 'Pool de talentos especializado',
    description:
      'Acesse milhares de profissionais verificados em Legal Ops, CLM, e operações jurídicas.',
  },
  {
    icon: Search,
    title: 'Filtros avançados',
    description:
      'Filtre por especialização, ferramentas dominadas, anos de experiência, pretensão salarial e localização.',
  },
  {
    icon: Zap,
    title: 'Contratação mais rápida',
    description:
      'Reduza o tempo de contratação de meses para semanas com candidatos pré-qualificados.',
  },
  {
    icon: BarChart3,
    title: 'Analytics de recrutamento',
    description:
      'Dashboard com métricas de funil, tempo de contratação e qualidade dos candidatos.',
  },
  {
    icon: Shield,
    title: 'Candidatos verificados',
    description:
      'Perfis profissionais completos com histórico, certificações e avaliações da comunidade.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Publique sua vaga',
    description: 'Descreva o que busca. Nossa IA enriquece automaticamente com dados do mercado.',
  },
  {
    number: '02',
    title: 'Receba matches',
    description:
      'Em minutos, nosso algoritmo identifica os profissionais mais alinhados ao seu perfil de vaga.',
  },
  {
    number: '03',
    title: 'Conecte-se',
    description:
      'Entre em contato diretamente com os candidatos ou deixe que eles apliquem à sua vaga.',
  },
]

export default function ForEmployersPage() {
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
              href="/pricing"
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-950"
            >
              Preços
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

      <main className="mx-auto max-w-6xl px-6">
        {/* Hero */}
        <section className="py-16 sm:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Para Empresas
            </p>
            <h1
              className="font-serif mt-3 text-4xl leading-tight sm:text-5xl"
            >
              Contrate os melhores profissionais de Legal Ops
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Acesse o maior pool de talentos especializados em operações jurídicas.
              Match automático com IA. Candidatos pré-qualificados e filtrados.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                Publicar uma vaga — $299
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 px-6 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-950"
              >
                Ver todos os planos
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-stone-200 py-16">
          <h2
            className="font-serif text-3xl sm:text-4xl"
          >
            Como funciona
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number}>
                <span className="text-4xl font-bold text-slate-200">{step.number}</span>
                <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-stone-200 py-16">
          <h2
            className="font-serif text-3xl sm:text-4xl"
          >
            Por que empresas escolhem LegalOps
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-xl border border-stone-200 bg-white p-6">
                <feature.icon className="h-6 w-6 text-slate-700" />
                <h3 className="mt-3 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="border-t border-stone-200 py-16">
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <p className="text-4xl font-bold">500+</p>
              <p className="mt-1 text-sm text-slate-600">Vagas mapeadas</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold">95%</p>
              <p className="mt-1 text-sm text-slate-600">Match score médio</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold">2 sem</p>
              <p className="mt-1 text-sm text-slate-600">Tempo médio de contratação</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mb-16 rounded-2xl border border-stone-200 bg-white px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2
                className="font-serif text-3xl"
              >
                Pronto para encontrar seu próximo talento?
              </h2>
              <p className="mt-2 text-slate-600">
                Publique sua primeira vaga hoje e receba matches em minutos.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              Começar agora
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
