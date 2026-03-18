import Link from 'next/link'
import { ArrowRight, Users, Zap, BarChart3, Shield, Search, Target } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'

type Locale = 'pt' | 'en'

const content = {
  pt: {
    lang: 'pt-BR',
    homeHref: '/',
    pricingHref: '/pricing',
    pricingLabel: 'Preços',
    signIn: 'Entrar',
    heroTag: 'Para Empresas',
    heroTitle: 'Contrate os melhores profissionais de Legal Ops',
    heroDescription:
      'Acesse o maior pool de talentos especializados em operações jurídicas. Match automático com IA. Candidatos pré-qualificados e filtrados.',
    ctaPost: 'Publicar uma vaga — $299',
    ctaPlans: 'Ver todos os planos',
    howTitle: 'Como funciona',
    whyTitle: 'Por que empresas escolhem LegalOps',
    statJobs: 'Vagas mapeadas',
    statMatch: 'Match score médio',
    statTime: 'Tempo médio de contratação',
    statTimeValue: '2 sem',
    ctaBottomTitle: 'Pronto para encontrar seu próximo talento?',
    ctaBottomDescription: 'Publique sua primeira vaga hoje e receba matches em minutos.',
    ctaBottomButton: 'Começar agora',
    features: [
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
    ],
    steps: [
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
    ],
  },
  en: {
    lang: 'en',
    homeHref: '/en',
    pricingHref: '/en/pricing',
    pricingLabel: 'Pricing',
    signIn: 'Sign in',
    heroTag: 'For Employers',
    heroTitle: 'Hire the best Legal Ops professionals',
    heroDescription:
      'Access the largest pool of talent specialized in legal operations. AI-powered matching. Pre-qualified and filtered candidates.',
    ctaPost: 'Post a job — $299',
    ctaPlans: 'View all plans',
    howTitle: 'How it works',
    whyTitle: 'Why companies choose LegalOps',
    statJobs: 'Jobs mapped',
    statMatch: 'Average match score',
    statTime: 'Average time to hire',
    statTimeValue: '2 wks',
    ctaBottomTitle: 'Ready to find your next talent?',
    ctaBottomDescription: 'Post your first job today and receive matches in minutes.',
    ctaBottomButton: 'Get started',
    features: [
      {
        icon: Target,
        title: 'AI-powered matching',
        description:
          'Our algorithm analyzes skills, experience, and preferences to connect you with ideal candidates.',
      },
      {
        icon: Users,
        title: 'Specialized talent pool',
        description:
          'Access thousands of verified professionals in Legal Ops, CLM, and legal operations.',
      },
      {
        icon: Search,
        title: 'Advanced filters',
        description:
          'Filter by specialization, tool expertise, years of experience, salary expectations, and location.',
      },
      {
        icon: Zap,
        title: 'Faster hiring',
        description:
          'Reduce time-to-hire from months to weeks with pre-qualified candidates.',
      },
      {
        icon: BarChart3,
        title: 'Recruitment analytics',
        description:
          'Dashboard with funnel metrics, time-to-hire, and candidate quality insights.',
      },
      {
        icon: Shield,
        title: 'Verified candidates',
        description:
          'Complete professional profiles with work history, certifications, and community reviews.',
      },
    ],
    steps: [
      {
        number: '01',
        title: 'Post your job',
        description: 'Describe what you\'re looking for. Our AI automatically enriches it with market data.',
      },
      {
        number: '02',
        title: 'Receive matches',
        description:
          'Within minutes, our algorithm identifies the professionals best aligned with your job profile.',
      },
      {
        number: '03',
        title: 'Connect',
        description:
          'Reach out directly to candidates or let them apply to your job posting.',
      },
    ],
  },
}

export function ForEmployersPage({ locale }: { locale: Locale }) {
  const copy = content[locale]

  return (
    <div lang={copy.lang} className="min-h-screen bg-[#F5F4F0] text-[#1A1A1A]">
      <header className="border-b border-[#1A1A1A]/10 bg-[#F5F4F0]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href={copy.homeHref}>
            <BrandLogo
              className="flex items-center gap-3"
              markClassName="h-10 w-10 text-[#1A1A1A]"
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={copy.pricingHref}
              className="rounded-xl border-2 border-[#1A1A1A] px-4 py-2 text-sm font-bold text-[#1A1A1A] transition-colors hover:bg-[#1A1A1A]/5"
            >
              {copy.pricingLabel}
            </Link>
            <Link
              href="/login"
              className="rounded-xl bg-[#1A1A1A] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-black"
            >
              {copy.signIn}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        {/* Hero */}
        <section className="py-16 sm:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#1A1A1A]/50">
              {copy.heroTag}
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">
              {copy.heroTitle}
            </h1>
            <p className="mt-4 text-lg leading-8 text-[#1A1A1A]/70">
              {copy.heroDescription}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6A00] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#E65C00]"
              >
                {copy.ctaPost}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={copy.pricingHref}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#1A1A1A] px-6 py-3 text-sm font-bold text-[#1A1A1A] transition-colors hover:bg-[#1A1A1A]/5"
              >
                {copy.ctaPlans}
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-[#1A1A1A]/10 py-16">
          <h2 className="text-3xl font-bold sm:text-4xl">
            {copy.howTitle}
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {copy.steps.map((step) => (
              <div key={step.number}>
                <span className="text-4xl font-bold text-[#1A1A1A]/10">{step.number}</span>
                <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#1A1A1A]/70">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-[#1A1A1A]/10 py-16">
          <h2 className="text-3xl font-bold sm:text-4xl">
            {copy.whyTitle}
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {copy.features.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-[#1A1A1A]/10 bg-white p-6">
                <feature.icon className="h-6 w-6 text-[#FF6A00]" />
                <h3 className="mt-3 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#1A1A1A]/70">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="border-t border-[#1A1A1A]/10 py-16">
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <p className="text-4xl font-bold">500+</p>
              <p className="mt-1 text-sm text-[#1A1A1A]/70">{copy.statJobs}</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold">95%</p>
              <p className="mt-1 text-sm text-[#1A1A1A]/70">{copy.statMatch}</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold">{copy.statTimeValue}</p>
              <p className="mt-1 text-sm text-[#1A1A1A]/70">{copy.statTime}</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mb-16 rounded-2xl border border-[#1A1A1A]/10 bg-white px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold">
                {copy.ctaBottomTitle}
              </h2>
              <p className="mt-2 text-[#1A1A1A]/70">
                {copy.ctaBottomDescription}
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6A00] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#E65C00]"
            >
              {copy.ctaBottomButton}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
