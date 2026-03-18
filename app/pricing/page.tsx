import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'

const professionalPlans = [
  {
    name: 'Free',
    price: '$0',
    period: '/mês',
    description: 'Para quem está começando na área de Legal Ops.',
    features: [
      'Perfil profissional público',
      'Descoberta de vagas (feed básico)',
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
    description: 'Para profissionais que querem acelerar a carreira.',
    features: [
      'Tudo do Free +',
      'Pipeline completo (Kanban)',
      '10 aliases de email',
      'AI Interview Prep ilimitado',
      'AI Cover Letter ilimitado',
      'Alertas personalizados de vagas',
      'Perfil destacado no diretório',
      'Match score automático com vagas',
    ],
    cta: 'Assinar Pro',
    href: '/login',
    highlight: true,
  },
  {
    name: 'Expert',
    price: '$99',
    period: '/mês',
    description: 'Para líderes e referências do mercado.',
    features: [
      'Tudo do Pro +',
      'Publicação de artigos/insights',
      'Aliases de email ilimitados',
      'AI Agent pessoal de pesquisa',
      'Selo "Expert" verificado',
      'Acesso antecipado a vagas premium',
      'Convite para eventos exclusivos',
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
    description: 'Publique vagas e alcance profissionais qualificados.',
    features: [
      'Publicação de 1 vaga',
      'Visibilidade por 30 dias',
      'Até 50 candidatos',
      'Descrição enriquecida com IA',
      'Match automático básico',
    ],
    cta: 'Publicar vaga',
    href: '/for-employers',
    highlight: false,
  },
  {
    name: 'Talent Access',
    price: '$999',
    period: '/mês',
    description: 'Acesso completo ao pool de talentos de Legal Ops.',
    features: [
      'Vagas ilimitadas',
      'Match automático com IA avançada',
      'Filtros avançados de candidatos',
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
    description: 'Para grandes operações de recrutamento jurídico.',
    features: [
      'Tudo do Talent Access +',
      'API de integração',
      'Account manager dedicado',
      'Employer branding page',
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
          ? 'border-2 border-[#FF6A00] bg-[#1A1A1A] text-white shadow-xl'
          : 'border-[#1A1A1A]/10 bg-white'
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
                plan.highlight ? 'text-[#FF6A00]' : 'text-[#1A1A1A]/40'
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
            ? 'bg-[#FF6A00] text-white hover:bg-[#E65C00]'
            : 'bg-[#1A1A1A] text-white hover:bg-black'
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
    <div className="min-h-screen bg-[#F5F4F0] text-[#1A1A1A]">
      <header className="border-b border-[#1A1A1A]/10 bg-[#F5F4F0]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/">
            <BrandLogo
              className="flex items-center gap-3"
              markClassName="h-10 w-10 text-[#1A1A1A]"
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/for-employers"
              className="rounded-xl border-2 border-[#1A1A1A] px-4 py-2 text-sm font-bold text-[#1A1A1A] transition-colors hover:bg-[#1A1A1A]/5"
            >
              Para Empresas
            </Link>
            <Link
              href="/login"
              className="rounded-xl bg-[#1A1A1A] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-black"
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        {/* Hero */}
        <div className="text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">
            Planos para cada fase da sua carreira
          </h1>
          <p className="mt-4 text-lg text-[#1A1A1A]/70">
            De profissional iniciante a líder referência em Legal Ops.
          </p>
        </div>

        {/* Professional Plans */}
        <section className="mt-12">
          <h2 className="text-center text-xs font-semibold uppercase tracking-widest text-[#1A1A1A]/50">
            Para Profissionais
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {professionalPlans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </div>
        </section>

        {/* Employer Plans */}
        <section className="mt-20">
          <h2 className="text-center text-xs font-semibold uppercase tracking-widest text-[#1A1A1A]/50">
            Para Empresas
          </h2>
          <p className="mt-2 text-center text-lg text-[#1A1A1A]/70">
            Encontre os melhores profissionais de Legal Ops do mercado.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {employerPlans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </div>
        </section>

        {/* FAQ / CTA */}
        <section className="mt-20 rounded-2xl border border-[#1A1A1A]/10 bg-white px-6 py-8 text-center sm:px-8">
          <h2 className="text-3xl font-bold">
            Comece grátis. Evolua quando quiser.
          </h2>
          <p className="mt-3 text-[#1A1A1A]/70">
            Sem compromisso. Cancele a qualquer momento.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6A00] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#E65C00]"
          >
            Criar conta grátis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    </div>
  )
}
