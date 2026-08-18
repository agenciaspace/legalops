import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'

const professionalPlans = [
  {
    name: 'Free',
    price: '$0',
    period: '/mês',
    description: 'Para descobrir oportunidades e construir presença profissional em Legal Ops e áreas próximas.',
    features: [
      'Perfil profissional público',
      'Descoberta de vagas em operações jurídicas',
      '1 alias de email',
      'Acesso ao diretório de profissionais',
    ],
    cta: 'Começar grátis',
    href: '/login',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/mês',
    description: 'Para quem está se movimentando para uma nova função no jurídico.',
    features: [
      'Tudo do Free +',
      'Pipeline completo de candidaturas',
      '10 aliases de email',
      'Preparação para entrevistas com IA',
      'Carta de apresentação orientada à vaga',
      'Alertas personalizados de oportunidades',
      'Perfil destacado no diretório',
      'Aderência automática entre perfil e vaga',
    ],
    cta: 'Assinar Pro',
    href: '/login',
    highlight: true,
  },
  {
    name: 'Expert',
    price: '$99',
    period: '/mês',
    description: 'Para líderes e especialistas que querem ampliar sua presença no ecossistema jurídico.',
    features: [
      'Tudo do Pro +',
      'Publicação de artigos e insights',
      'Aliases de email ilimitados',
      'Agente pessoal de pesquisa de mercado',
      'Selo "Expert" verificado',
      'Acesso antecipado a oportunidades premium',
      'Convites para eventos exclusivos',
    ],
    cta: 'Assinar Expert',
    href: '/login',
    highlight: false,
  },
]

const employerPlans = [
  {
    name: 'Job Post',
    price: '$299',
    period: '/vaga',
    description: 'Publique uma oportunidade para profissionais de Legal Ops, Legal Tech e operações jurídicas.',
    features: [
      'Publicação de 1 vaga',
      'Visibilidade por 30 dias',
      'Até 50 candidatos',
      'Descrição revisada para clareza',
      'Aderência básica por perfil',
    ],
    cta: 'Publicar vaga',
    href: '/for-employers',
    highlight: false,
  },
  {
    name: 'Talent Access',
    price: '$999',
    period: '/mês',
    description: 'Acesso contínuo a profissionais que trabalham na transformação do jurídico.',
    features: [
      'Vagas ilimitadas',
      'Aderência avançada por perfil',
      'Filtros por competências e ferramentas',
      'Contato direto com profissionais',
      'Dashboard de métricas',
      'Integração com ATS',
    ],
    cta: 'Contratar plano',
    href: '/for-employers',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'Para organizações com contratação recorrente em jurídico, Legal Ops e Legal Tech.',
    features: [
      'Tudo do Talent Access +',
      'API de integração',
      'Account manager dedicado',
      'Página de employer branding',
      'Analytics avançado',
      'SLA de suporte',
    ],
    cta: 'Falar com vendas',
    href: '/for-employers',
    highlight: false,
  },
]

function PlanCard({
  plan,
}: {
  plan: (typeof professionalPlans)[number]
}) {
  return (
    <div
      className={`flex flex-col rounded-2xl border p-6 ${
        plan.highlight
          ? 'border-2 border-[#E88A6A] bg-[#111111] text-white shadow-[0_20px_60px_rgba(17,17,17,0.14)]'
          : 'border-[#CEC8BD] bg-white'
      }`}
    >
      <h3 className="text-lg font-semibold">{plan.name}</h3>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-4xl font-bold">{plan.price}</span>
        {plan.period && (
          <span className={plan.highlight ? 'text-white/50' : 'text-[#1A1A1A]/60'}>
            {plan.period}
          </span>
        )}
      </div>
      <p
        className={`mt-3 text-sm ${
          plan.highlight ? 'text-white/70' : 'text-[#1A1A1A]/70'
        }`}
      >
        {plan.description}
      </p>
      <ul className="mt-6 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <Check
              className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                plan.highlight ? 'text-[#E88A6A]' : 'text-[#C9684F]'
              }`}
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        href={plan.href}
        className={`mt-6 flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-colors ${
          plan.highlight
            ? 'bg-[#E88A6A] text-[#111111] hover:bg-[#DE7B5C]'
            : 'bg-[#111111] text-white hover:bg-[#2A2927]'
        }`}
      >
        {plan.cta}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#111111]">
      <header className="border-b border-[#CEC8BD] bg-[#F5F1E8]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/">
            <BrandLogo
              className="flex items-center gap-3"
              markClassName="h-10 w-10 text-[#111111]"
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/for-employers"
              className="rounded-full border border-[#CEC8BD] bg-white/60 px-4 py-2 text-sm font-bold text-[#111111] transition-colors hover:bg-white"
            >
              Para Empresas
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-[#111111] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#2A2927]"
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-semibold tracking-[-0.05em] sm:text-5xl" style={{ fontFamily: 'var(--font-quicksand), ui-rounded, sans-serif' }}>
            Ferramentas para construir sua carreira no jurídico moderno
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#625E59]">
            Para profissionais de Legal Ops, Legal Tech, contratos, dados e operações — e para as organizações que querem encontrá-los.
          </p>
        </div>

        <section className="mt-12">
          <h2 className="text-center text-xs font-bold uppercase tracking-widest text-[#C9684F]">
            Para Profissionais
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {professionalPlans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-center text-xs font-bold uppercase tracking-widest text-[#C9684F]">
            Para Empresas
          </h2>
          <p className="mt-2 text-center text-lg text-[#625E59]">
            Encontre pessoas que sabem operar, modernizar e escalar o trabalho jurídico.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {employerPlans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </div>
        </section>

        <section className="mt-20 rounded-[26px] border border-[#CEC8BD] bg-[#FAF7F1] px-6 py-8 text-center sm:px-8">
          <h2 className="text-3xl font-semibold tracking-[-0.04em]" style={{ fontFamily: 'var(--font-quicksand), ui-rounded, sans-serif' }}>
            Comece pelo que você precisa agora.
          </h2>
          <p className="mt-3 text-[#625E59]">
            Descubra vagas, organize sua busca e evolua conforme sua carreira ou contratação exigir.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#E88A6A] px-6 py-3 text-sm font-bold text-[#111111] transition-colors hover:bg-[#DE7B5C]"
          >
            Criar conta grátis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    </div>
  )
}
