import Link from 'next/link'
import { ArrowRight, Users, Zap, BarChart3, Shield, Search, Target, Globe } from 'lucide-react'
import { BrandMark } from '@/components/BrandLogo'

type Locale = 'pt' | 'en'

const content = {
  pt: {
    languageHref: '/en/for-employers',
    languageLabel: 'English',
    languageCompact: 'EN',
    pricingLabel: 'Preços',
    pricingHref: '/pricing',
    signIn: 'Entrar',
    badge: 'Para Empresas',
    heroTitle: 'Contrate os melhores profissionais de Legal Ops',
    heroDescription:
      'Acesse o maior pool de talentos especializados em operações jurídicas. Match automático com IA. Candidatos pré-qualificados e filtrados.',
    heroPrimaryCta: 'Publicar uma vaga — $299',
    heroSecondaryCta: 'Ver todos os planos',
    howItWorksTitle: 'Como funciona',
    whyTitle: 'Por que empresas escolhem LegalOps',
    ctaTitle: 'Pronto para encontrar seu próximo talento?',
    ctaDescription: 'Publique sua primeira vaga hoje e receba matches em minutos.',
    ctaCta: 'Começar agora',
    stats: [
      { value: '500+', label: 'Vagas mapeadas' },
      { value: '95%', label: 'Match score médio' },
      { value: '2 sem', label: 'Tempo médio de contratação' },
    ],
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
    languageHref: '/for-employers',
    languageLabel: 'Português',
    languageCompact: 'PT',
    pricingLabel: 'Pricing',
    pricingHref: '/en/pricing',
    signIn: 'Sign in',
    badge: 'For Employers',
    heroTitle: 'Hire the best Legal Ops professionals',
    heroDescription:
      'Access the largest pool of specialized legal operations talent. AI-powered matching. Pre-qualified, filtered candidates.',
    heroPrimaryCta: 'Post a job — $299',
    heroSecondaryCta: 'View all plans',
    howItWorksTitle: 'How it works',
    whyTitle: 'Why companies choose LegalOps',
    ctaTitle: 'Ready to find your next talent?',
    ctaDescription: 'Post your first job today and receive matches in minutes.',
    ctaCta: 'Get started',
    stats: [
      { value: '500+', label: 'Jobs mapped' },
      { value: '95%', label: 'Average match score' },
      { value: '2 wks', label: 'Average time to hire' },
    ],
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
          'Filter by specialization, tools mastered, years of experience, salary expectations, and location.',
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
          'Complete professional profiles with history, certifications, and community reviews.',
      },
    ],
    steps: [
      {
        number: '01',
        title: 'Post your job',
        description: 'Describe what you need. Our AI automatically enriches it with market data.',
      },
      {
        number: '02',
        title: 'Receive matches',
        description:
          'Within minutes, our algorithm identifies the professionals best aligned with your role.',
      },
      {
        number: '03',
        title: 'Connect',
        description:
          'Reach out directly to candidates or let them apply to your posting.',
      },
    ],
  },
} as const

export function ForEmployersPage({ locale }: { locale: Locale }) {
  const copy = content[locale]

  return (
    <div lang={locale === 'pt' ? 'pt-BR' : 'en'} className="min-h-screen bg-[#F5F4F0] text-[#1A1A1A]">
      <header className="border-b border-[#1A1A1A]/5 bg-[#F5F4F0]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href={locale === 'pt' ? '/' : '/en'} className="flex items-center gap-3">
            <BrandMark className="h-8 w-8 md:h-10 md:w-10 text-[#FF6A00]" />
            <span className="font-bold text-xl md:text-2xl tracking-tight text-[#1A1A1A]">
              legalops.work
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={copy.pricingHref}
              className="hidden sm:inline-flex text-sm font-medium text-[#1A1A1A]/70 hover:text-[#FF6A00] transition-colors"
            >
              {copy.pricingLabel}
            </Link>
            <Link
              href={copy.languageHref}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">{copy.languageLabel}</span>
              <span className="sm:hidden">{copy.languageCompact}</span>
            </Link>
            <Link
              href="/login"
              className="bg-[#1A1A1A] hover:bg-[#1A1A1A]/80 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors"
            >
              {copy.signIn}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6">
        {/* Hero */}
        <section className="py-16 sm:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#1A1A1A]/40">
              {copy.badge}
            </p>
            <h1
              className="mt-3 text-4xl leading-tight sm:text-5xl"
              style={{
                fontFamily:
                  '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
              }}
            >
              {copy.heroTitle}
            </h1>
            <p className="mt-4 text-lg leading-8 text-[#1A1A1A]/60">
              {copy.heroDescription}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1A1A1A] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1A1A1A]/80"
              >
                {copy.heroPrimaryCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={copy.pricingHref}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#1A1A1A]/15 px-6 py-3 text-sm font-medium text-[#1A1A1A]/70 transition-colors hover:border-[#1A1A1A]"
              >
                {copy.heroSecondaryCta}
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-[#1A1A1A]/10 py-16">
          <h2
            className="text-3xl sm:text-4xl"
            style={{
              fontFamily:
                '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
            }}
          >
            {copy.howItWorksTitle}
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {copy.steps.map((step) => (
              <div key={step.number}>
                <span className="text-4xl font-bold text-[#1A1A1A]/15">{step.number}</span>
                <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#1A1A1A]/60">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-[#1A1A1A]/10 py-16">
          <h2
            className="text-3xl sm:text-4xl"
            style={{
              fontFamily:
                '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
            }}
          >
            {copy.whyTitle}
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {copy.features.map((feature) => (
              <div key={feature.title} className="rounded-xl border border-[#1A1A1A]/10 bg-white p-6">
                <feature.icon className="h-6 w-6 text-[#1A1A1A]/70" />
                <h3 className="mt-3 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#1A1A1A]/60">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="border-t border-[#1A1A1A]/10 py-16">
          <div className="grid gap-8 sm:grid-cols-3">
            {copy.stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl font-bold">{stat.value}</p>
                <p className="mt-1 text-sm text-[#1A1A1A]/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mb-16 rounded-2xl border border-[#1A1A1A]/10 bg-white px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2
                className="text-3xl"
                style={{
                  fontFamily:
                    '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
                }}
              >
                {copy.ctaTitle}
              </h2>
              <p className="mt-2 text-[#1A1A1A]/60">
                {copy.ctaDescription}
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1A1A1A] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1A1A1A]/80"
            >
              {copy.ctaCta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
