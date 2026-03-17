import Link from 'next/link'
import { Check, X, ArrowRight, Target, Users, Search, Zap, BarChart3, Shield, Building2, Headphones, Code, Palette } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'

const plans = [
  {
    name: 'Job Post',
    price: '$299',
    period: '/vaga',
    description: 'Publique uma vaga e alcance os melhores profissionais de Legal Ops do mercado.',
    cta: 'Publicar vaga',
    href: '/login',
    highlight: false,
  },
  {
    name: 'Talent Access',
    price: '$999',
    period: '/mês',
    description: 'Acesso completo ao pool de talentos. Ideal para recrutamento contínuo.',
    cta: 'Contratar plano',
    href: '/login',
    highlight: true,
    badge: 'Melhor valor',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'Para grandes operações com necessidades avançadas de integração e suporte.',
    cta: 'Falar com vendas',
    href: '/login',
    highlight: false,
  },
]

interface Feature {
  name: string
  jobPost: string | boolean
  talentAccess: string | boolean
  enterprise: string | boolean
}

const features: { category: string; items: Feature[] }[] = [
  {
    category: 'Publicação de vagas',
    items: [
      { name: 'Vagas publicadas', jobPost: '1 vaga', talentAccess: 'Ilimitadas', enterprise: 'Ilimitadas' },
      { name: 'Visibilidade da vaga', jobPost: '30 dias', talentAccess: 'Enquanto ativa', enterprise: 'Enquanto ativa' },
      { name: 'Candidatos por vaga', jobPost: 'Até 50', talentAccess: 'Ilimitados', enterprise: 'Ilimitados' },
      { name: 'Descrição enriquecida com IA', jobPost: true, talentAccess: true, enterprise: true },
    ],
  },
  {
    category: 'Matching e busca',
    items: [
      { name: 'Match automático com candidatos', jobPost: 'Básico', talentAccess: 'IA avançada', enterprise: 'IA avançada + custom' },
      { name: 'Filtros avançados de candidatos', jobPost: false, talentAccess: true, enterprise: true },
      { name: 'Busca por skills, ferramentas e certificações', jobPost: false, talentAccess: true, enterprise: true },
      { name: 'Filtro por pretensão salarial', jobPost: false, talentAccess: true, enterprise: true },
      { name: 'Contato direto com profissionais', jobPost: false, talentAccess: true, enterprise: true },
    ],
  },
  {
    category: 'Analytics e gestão',
    items: [
      { name: 'Dashboard de métricas do funil', jobPost: false, talentAccess: true, enterprise: true },
      { name: 'Relatórios de qualidade de candidatos', jobPost: false, talentAccess: true, enterprise: true },
      { name: 'Analytics avançado e exportação', jobPost: false, talentAccess: false, enterprise: true },
      { name: 'Múltiplos recrutadores na conta', jobPost: false, talentAccess: 'Até 5', enterprise: 'Ilimitados' },
    ],
  },
  {
    category: 'Integração e suporte',
    items: [
      { name: 'Integração com ATS (Greenhouse, Lever, etc.)', jobPost: false, talentAccess: true, enterprise: true },
      { name: 'API de integração', jobPost: false, talentAccess: false, enterprise: true },
      { name: 'Employer branding page personalizada', jobPost: false, talentAccess: false, enterprise: true },
      { name: 'Account manager dedicado', jobPost: false, talentAccess: false, enterprise: true },
      { name: 'SLA de suporte', jobPost: 'Email', talentAccess: 'Email + chat', enterprise: 'Prioritário + SLA' },
    ],
  },
]

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="mx-auto h-5 w-5 text-emerald-600" />
  if (value === false) return <X className="mx-auto h-5 w-5 text-slate-300" />
  return <span className="text-sm font-medium text-slate-700">{value}</span>
}

export default function EmployersPricingPage() {
  return (
    <div className="min-h-screen bg-stone-50 text-slate-950">
      <header className="border-b border-stone-200 bg-stone-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/">
            <BrandLogo className="flex items-center gap-3" markClassName="h-10 w-10 text-slate-950" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/pricing/professionals"
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-950"
            >
              Para Profissionais
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

      <main className="mx-auto max-w-6xl px-6 py-16">
        {/* Hero */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
            Para Empresas
          </p>
          <h1
            className="mt-3 text-4xl sm:text-5xl"
            style={{
              fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
            }}
          >
            Contrate os melhores talentos de Legal Ops
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Acesse o maior pool de profissionais especializados em operações jurídicas.
            Match com IA, filtros avançados e candidatos pré-qualificados.
          </p>
        </div>

        {/* Stats bar */}
        <div className="mt-10 grid grid-cols-3 gap-6 rounded-2xl border border-stone-200 bg-white p-6">
          <div className="text-center">
            <p className="text-3xl font-bold">500+</p>
            <p className="mt-1 text-sm text-slate-500">Profissionais no pool</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">95%</p>
            <p className="mt-1 text-sm text-slate-500">Match score médio</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">2 sem</p>
            <p className="mt-1 text-sm text-slate-500">Tempo médio de contratação</p>
          </div>
        </div>

        {/* Plan cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                plan.highlight
                  ? 'border-slate-950 bg-slate-950 text-white shadow-xl'
                  : 'border-stone-200 bg-white'
              }`}
            >
              {'badge' in plan && plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                  {plan.badge}
                </span>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.period && (
                  <span className={plan.highlight ? 'text-slate-400' : 'text-slate-500'}>
                    {plan.period}
                  </span>
                )}
              </div>
              <p className={`mt-3 text-sm ${plan.highlight ? 'text-slate-300' : 'text-slate-600'}`}>
                {plan.description}
              </p>
              <div className="flex-1" />
              <Link
                href={plan.href}
                className={`mt-6 flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors ${
                  plan.highlight
                    ? 'bg-white text-slate-950 hover:bg-slate-100'
                    : 'bg-slate-950 text-white hover:bg-slate-800'
                }`}
              >
                {plan.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>

        {/* Feature comparison */}
        <section className="mt-20">
          <h2
            className="text-center text-3xl"
            style={{
              fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
            }}
          >
            Comparação detalhada
          </h2>
          <p className="mt-2 text-center text-slate-500">
            Escolha o plano ideal para a necessidade de recrutamento da sua empresa.
          </p>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="pb-4 pr-4 text-left text-sm font-medium text-slate-500">Recurso</th>
                  <th className="pb-4 px-4 text-center text-sm font-semibold">Job Post</th>
                  <th className="pb-4 px-4 text-center">
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white">
                      Talent Access
                    </span>
                  </th>
                  <th className="pb-4 pl-4 text-center text-sm font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {features.map((group) => (
                  <tbody key={group.category}>
                    <tr>
                      <td
                        colSpan={4}
                        className="pt-6 pb-2 text-xs font-semibold uppercase tracking-widest text-slate-400"
                      >
                        {group.category}
                      </td>
                    </tr>
                    {group.items.map((feature) => (
                      <tr key={feature.name} className="border-b border-stone-100">
                        <td className="py-3 pr-4 text-sm text-slate-700">{feature.name}</td>
                        <td className="py-3 px-4 text-center">
                          <CellValue value={feature.jobPost} />
                        </td>
                        <td className="py-3 px-4 text-center bg-emerald-50/30">
                          <CellValue value={feature.talentAccess} />
                        </td>
                        <td className="py-3 pl-4 text-center">
                          <CellValue value={feature.enterprise} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Why employers choose us */}
        <section className="mt-20">
          <h2
            className="text-center text-3xl"
            style={{
              fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
            }}
          >
            Por que empresas escolhem LegalOps
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Target,
                title: 'Match automático com IA',
                description:
                  'Nosso algoritmo analisa skills, ferramentas, certificações e preferências para conectar você aos candidatos ideais.',
              },
              {
                icon: Users,
                title: 'Pool 100% especializado',
                description:
                  'Todos os profissionais são de Legal Ops, CLM, Compliance ou áreas correlatas. Zero ruído, só candidatos relevantes.',
              },
              {
                icon: Search,
                title: 'Filtros granulares',
                description:
                  'Filtre por ferramenta dominada (Ironclad, DocuSign, Agiloft...), anos de experiência, certificações e localização.',
              },
              {
                icon: Zap,
                title: 'Contratação mais rápida',
                description:
                  'Reduza o tempo de contratação de meses para semanas com candidatos pré-qualificados e prontos para entrevista.',
              },
              {
                icon: BarChart3,
                title: 'Analytics de recrutamento',
                description:
                  'Dashboard com métricas de funil, tempo de contratação, qualidade dos candidatos e ROI por vaga.',
              },
              {
                icon: Shield,
                title: 'Perfis verificados',
                description:
                  'Profissionais com perfis completos: histórico, certificações, ferramentas dominadas e avaliações da comunidade.',
              },
            ].map((feature) => (
              <div key={feature.title} className="rounded-xl border border-stone-200 bg-white p-6">
                <feature.icon className="h-6 w-6 text-slate-700" />
                <h3 className="mt-3 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mt-20">
          <h2
            className="text-center text-3xl"
            style={{
              fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
            }}
          >
            Como funciona
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              {
                number: '01',
                icon: Building2,
                title: 'Crie sua conta de empresa',
                description: 'Configure o perfil da empresa, adicione recrutadores e defina o que busca em candidatos.',
              },
              {
                number: '02',
                icon: Palette,
                title: 'Publique vagas enriquecidas',
                description: 'Descreva a vaga e nossa IA enriquece com dados de mercado, salary benchmarks e skills relevantes.',
              },
              {
                number: '03',
                icon: Zap,
                title: 'Receba matches e contrate',
                description: 'Em minutos, nosso algoritmo identifica os profissionais mais alinhados. Conecte-se diretamente.',
              },
            ].map((step) => (
              <div key={step.number} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <step.icon className="h-6 w-6 text-slate-700" />
                </div>
                <span className="mt-4 block text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Passo {step.number}
                </span>
                <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-20">
          <h2
            className="text-center text-3xl"
            style={{
              fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
            }}
          >
            Perguntas frequentes
          </h2>
          <div className="mx-auto mt-8 max-w-2xl space-y-6">
            {[
              {
                q: 'Quanto custa publicar uma vaga avulsa?',
                a: '$299 por vaga, com visibilidade por 30 dias e até 50 candidatos. Inclui descrição enriquecida com IA e match automático básico.',
              },
              {
                q: 'O plano Talent Access vale a pena para quantas vagas?',
                a: 'A partir de 4 vagas por mês, o Talent Access ($999/mês com vagas ilimitadas) já é mais econômico que publicar avulsas. Além disso, inclui filtros avançados, contato direto e dashboard.',
              },
              {
                q: 'Posso integrar com meu ATS?',
                a: 'Sim. O plano Talent Access inclui integração com Greenhouse, Lever, Workable e outros. O Enterprise oferece API completa para integrações customizadas.',
              },
              {
                q: 'Os candidatos são verificados?',
                a: 'Os profissionais preenchem perfis detalhados com histórico, certificações e ferramentas. Perfis Expert passam por verificação adicional.',
              },
              {
                q: 'Qual o SLA do plano Enterprise?',
                a: 'O Enterprise inclui account manager dedicado, suporte prioritário com SLA definido, e onboarding personalizado. Entre em contato para detalhes.',
              },
            ].map((faq) => (
              <div key={faq.q} className="rounded-xl border border-stone-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-slate-900">{faq.q}</h3>
                <p className="mt-2 text-sm text-slate-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-20 rounded-2xl border border-stone-200 bg-white px-6 py-8 text-center sm:px-8">
          <h2
            className="text-3xl"
            style={{
              fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
            }}
          >
            Pronto para encontrar seu próximo talento?
          </h2>
          <p className="mt-3 text-slate-600">
            Publique sua primeira vaga hoje e receba matches em minutos.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              Publicar uma vaga — $299
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing/professionals"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 px-6 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-950"
            >
              Sou profissional
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
