import Link from 'next/link'
import { Check, X, ArrowRight, Sparkles, Briefcase, Mail, Brain, Star, BookOpen, Bell, LayoutGrid, Users } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/mês',
    description: 'Para quem está começando na área de Legal Ops e quer explorar a plataforma.',
    cta: 'Começar grátis',
    href: '/login',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/mês',
    description: 'Para profissionais que querem acelerar a carreira e se destacar no mercado.',
    cta: 'Assinar Pro',
    href: '/login',
    highlight: true,
    badge: 'Mais popular',
  },
  {
    name: 'Expert',
    price: '$99',
    period: '/mês',
    description: 'Para líderes e referências que querem se posicionar como autoridade no mercado.',
    cta: 'Assinar Expert',
    href: '/login',
    highlight: false,
  },
]

interface Feature {
  name: string
  icon: React.ElementType
  free: string | boolean
  pro: string | boolean
  expert: string | boolean
}

const features: { category: string; items: Feature[] }[] = [
  {
    category: 'Perfil e visibilidade',
    items: [
      { name: 'Perfil profissional público', icon: Users, free: true, pro: true, expert: true },
      { name: 'Destaque no diretório de profissionais', icon: Star, free: false, pro: true, expert: true },
      { name: 'Selo "Expert" verificado', icon: Sparkles, free: false, pro: false, expert: true },
      { name: 'Publicação de artigos e insights', icon: BookOpen, free: false, pro: false, expert: true },
    ],
  },
  {
    category: 'Descoberta de vagas',
    items: [
      { name: 'Feed de vagas curadas', icon: Briefcase, free: 'Básico', pro: 'Completo', expert: 'Completo + Premium' },
      { name: 'Match score automático com vagas', icon: Brain, free: false, pro: true, expert: true },
      { name: 'Alertas personalizados de vagas', icon: Bell, free: false, pro: true, expert: true },
      { name: 'Acesso antecipado a vagas premium', icon: Sparkles, free: false, pro: false, expert: true },
    ],
  },
  {
    category: 'Pipeline de aplicações',
    items: [
      { name: 'Tracking básico (lista)', icon: LayoutGrid, free: true, pro: true, expert: true },
      { name: 'Pipeline completo (Kanban + timeline)', icon: LayoutGrid, free: false, pro: true, expert: true },
    ],
  },
  {
    category: 'Email aliases',
    items: [
      { name: 'Aliases de email profissional', icon: Mail, free: '1 alias', pro: '10 aliases', expert: 'Ilimitado' },
    ],
  },
  {
    category: 'Agentes de IA',
    items: [
      { name: 'AI Interview Prep', icon: Brain, free: false, pro: 'Ilimitado', expert: 'Ilimitado' },
      { name: 'AI Cover Letter', icon: Brain, free: false, pro: 'Ilimitado', expert: 'Ilimitado' },
      { name: 'AI Agent pessoal de pesquisa', icon: Brain, free: false, pro: false, expert: true },
    ],
  },
  {
    category: 'Comunidade e networking',
    items: [
      { name: 'Acesso ao diretório de profissionais', icon: Users, free: true, pro: true, expert: true },
      { name: 'Convite para eventos exclusivos', icon: Star, free: false, pro: false, expert: true },
    ],
  },
]

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="mx-auto h-5 w-5 text-emerald-600" />
  if (value === false) return <X className="mx-auto h-5 w-5 text-slate-300" />
  return <span className="text-sm font-medium text-slate-700">{value}</span>
}

export default function ProfessionalsPricingPage() {
  return (
    <div className="min-h-screen bg-stone-50 text-slate-950">
      <header className="border-b border-stone-200 bg-stone-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/">
            <BrandLogo className="flex items-center gap-3" markClassName="h-10 w-10 text-slate-950" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/pricing/employers"
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

      <main className="mx-auto max-w-6xl px-6 py-16">
        {/* Hero */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
            Para Profissionais
          </p>
          <h1
            className="mt-3 text-4xl sm:text-5xl"
            style={{
              fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
            }}
          >
            Invista na sua carreira em Legal Ops
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Da descoberta de vagas ao posicionamento como referência no mercado.
            Ferramentas de IA, pipeline inteligente e a maior comunidade de Legal Ops.
          </p>
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
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                  {plan.badge}
                </span>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className={plan.highlight ? 'text-slate-400' : 'text-slate-500'}>
                  {plan.period}
                </span>
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

        {/* Feature comparison table */}
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
            Veja exatamente o que cada plano oferece.
          </p>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="pb-4 pr-4 text-left text-sm font-medium text-slate-500">Recurso</th>
                  <th className="pb-4 px-4 text-center text-sm font-semibold">Free</th>
                  <th className="pb-4 px-4 text-center">
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white">
                      Pro
                    </span>
                  </th>
                  <th className="pb-4 pl-4 text-center text-sm font-semibold">Expert</th>
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
                        <td className="py-3 pr-4 text-sm text-slate-700 flex items-center gap-2">
                          <feature.icon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          {feature.name}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <CellValue value={feature.free} />
                        </td>
                        <td className="py-3 px-4 text-center bg-blue-50/30">
                          <CellValue value={feature.pro} />
                        </td>
                        <td className="py-3 pl-4 text-center">
                          <CellValue value={feature.expert} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Benefits */}
        <section className="mt-20">
          <h2
            className="text-center text-3xl"
            style={{
              fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
            }}
          >
            Por que profissionais escolhem LegalOps
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Brain,
                title: 'IA que trabalha para você',
                description:
                  'Prepare-se para entrevistas, gere cover letters personalizadas e pesquise empresas automaticamente com nossos agentes de IA.',
              },
              {
                icon: Briefcase,
                title: 'Vagas curadas de Legal Ops',
                description:
                  'Não perca tempo filtrando vagas genéricas. Todas as vagas são específicas para Legal Operations, CLM e áreas correlatas.',
              },
              {
                icon: Mail,
                title: 'Email aliases profissionais',
                description:
                  'Use endereços de email exclusivos para cada aplicação. Proteja sua inbox e organize suas candidaturas.',
              },
              {
                icon: LayoutGrid,
                title: 'Pipeline visual de aplicações',
                description:
                  'Acompanhe cada candidatura em um Kanban visual com timeline de eventos, notas e contatos.',
              },
              {
                icon: Users,
                title: 'Comunidade especializada',
                description:
                  'Conecte-se com outros profissionais de Legal Ops, descubra mentores e amplie seu networking.',
              },
              {
                icon: Star,
                title: 'Posicione-se como referência',
                description:
                  'Publique artigos, receba selo Expert verificado e seja destaque no diretório de profissionais.',
              },
            ].map((benefit) => (
              <div key={benefit.title} className="rounded-xl border border-stone-200 bg-white p-6">
                <benefit.icon className="h-6 w-6 text-slate-700" />
                <h3 className="mt-3 font-semibold">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{benefit.description}</p>
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
                q: 'Posso cancelar a qualquer momento?',
                a: 'Sim. Não há fidelidade. Cancele quando quiser e continue usando até o fim do período pago.',
              },
              {
                q: 'O plano Free é realmente gratuito para sempre?',
                a: 'Sim. O plano Free dá acesso ao perfil público, feed básico de vagas, 1 alias de email e ao diretório de profissionais, sem prazo de expiração.',
              },
              {
                q: 'Qual a diferença entre Pro e Expert?',
                a: 'O Pro foca em ferramentas de carreira (pipeline, IA, alertas). O Expert adiciona posicionamento como autoridade: publicação de artigos, selo verificado, agente de pesquisa pessoal e acesso a eventos exclusivos.',
              },
              {
                q: 'Posso mudar de plano depois?',
                a: 'Sim. Faça upgrade ou downgrade a qualquer momento. Ajustamos o valor proporcional automaticamente.',
              },
              {
                q: 'Os agentes de IA usam meus dados para treinar modelos?',
                a: 'Não. Seus dados são usados exclusivamente para gerar outputs personalizados para você. Nada é compartilhado com terceiros ou usado para treinamento.',
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
            Comece grátis. Evolua quando quiser.
          </h2>
          <p className="mt-3 text-slate-600">
            Sem compromisso. Cancele a qualquer momento.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              Criar conta grátis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing/employers"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 px-6 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-950"
            >
              Sou uma empresa
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
