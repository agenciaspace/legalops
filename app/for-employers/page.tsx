'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Users, Zap, BarChart3, Shield, Search, Target, Globe, ChevronDown } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'

type Locale = 'pt' | 'en'

const content = {
  pt: {
    nav: { pricing: 'Preços', login: 'Entrar' },
    badge: 'Para Empresas',
    hero: {
      title: 'Contrate os melhores profissionais de Legal Ops',
      subtitle:
        'Acesse o maior pool de talentos especializados em operações jurídicas. Match automático com IA. Candidatos pré-qualificados e filtrados.',
      cta: 'Publicar uma vaga — $299',
      plans: 'Ver todos os planos',
    },
    howItWorks: {
      title: 'Como funciona',
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
    features: {
      title: 'Por que empresas escolhem LegalOps',
      items: [
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
    },
    stats: [
      { value: '500+', label: 'Vagas mapeadas' },
      { value: '95%', label: 'Match score médio' },
      { value: '2 sem', label: 'Tempo médio de contratação' },
    ],
    cta: {
      title: 'Pronto para encontrar seu próximo talento?',
      subtitle: 'Publique sua primeira vaga hoje e receba matches em minutos.',
      btn: 'Começar agora',
    },
  },
  en: {
    nav: { pricing: 'Pricing', login: 'Sign in' },
    badge: 'For Companies',
    hero: {
      title: 'Hire the best Legal Ops professionals',
      subtitle:
        'Access the largest pool of talent specialized in legal operations. AI-powered matching. Pre-qualified and filtered candidates.',
      cta: 'Post a job — $299',
      plans: 'View all plans',
    },
    howItWorks: {
      title: 'How it works',
      steps: [
        {
          number: '01',
          title: 'Post your job',
          description: 'Describe what you are looking for. Our AI automatically enriches it with market data.',
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
            'Reach out to candidates directly or let them apply to your posting.',
        },
      ],
    },
    features: {
      title: 'Why companies choose LegalOps',
      items: [
        {
          icon: Target,
          title: 'AI-powered matching',
          description:
            'Our algorithm analyzes skills, experience, and preferences to connect you with the ideal candidates.',
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
            'Complete professional profiles with work history, certifications, and community reviews.',
        },
      ],
    },
    stats: [
      { value: '500+', label: 'Jobs mapped' },
      { value: '95%', label: 'Average match score' },
      { value: '2 wks', label: 'Average time-to-hire' },
    ],
    cta: {
      title: 'Ready to find your next talent?',
      subtitle: 'Post your first job today and receive matches in minutes.',
      btn: 'Get started',
    },
  },
} as const

export default function ForEmployersPage() {
  const [lang, setLang] = useState<Locale>('en')
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false)
  const langMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const t = content[lang]

  return (
    <div lang={lang === 'pt' ? 'pt-BR' : 'en'} className="min-h-screen bg-[#F5F4F0] text-[#1A1A1A]">
      <header className="border-b border-[#1A1A1A]/10 bg-[#F5F4F0]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/">
            <BrandLogo
              className="flex items-center gap-3"
              markClassName="h-10 w-10 text-[#1A1A1A]"
            />
          </Link>
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-1.5 text-sm font-medium text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="uppercase">{lang}</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isLangMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-24 bg-white border border-[#1A1A1A]/10 rounded-lg shadow-lg py-1 overflow-hidden z-50">
                  <button
                    onClick={() => { setLang('pt'); setIsLangMenuOpen(false) }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-[#F5F4F0] transition-colors ${lang === 'pt' ? 'font-bold text-[#FF6A00]' : 'text-[#1A1A1A]/70'}`}
                  >
                    PT
                  </button>
                  <button
                    onClick={() => { setLang('en'); setIsLangMenuOpen(false) }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-[#F5F4F0] transition-colors ${lang === 'en' ? 'font-bold text-[#FF6A00]' : 'text-[#1A1A1A]/70'}`}
                  >
                    EN
                  </button>
                </div>
              )}
            </div>
            <Link
              href="/pricing"
              className="rounded-xl border-2 border-[#1A1A1A] px-4 py-2 text-sm font-bold text-[#1A1A1A] transition-colors hover:bg-[#1A1A1A]/5"
            >
              {t.nav.pricing}
            </Link>
            <Link
              href="/login"
              className="rounded-xl bg-[#1A1A1A] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-black"
            >
              {t.nav.login}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        {/* Hero */}
        <section className="py-16 sm:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#1A1A1A]/50">
              {t.badge}
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">
              {t.hero.title}
            </h1>
            <p className="mt-4 text-lg leading-8 text-[#1A1A1A]/70">
              {t.hero.subtitle}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6A00] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#E65C00]"
              >
                {t.hero.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#1A1A1A] px-6 py-3 text-sm font-bold text-[#1A1A1A] transition-colors hover:bg-[#1A1A1A]/5"
              >
                {t.hero.plans}
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-[#1A1A1A]/10 py-16">
          <h2 className="text-3xl font-bold sm:text-4xl">
            {t.howItWorks.title}
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {t.howItWorks.steps.map((step) => (
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
            {t.features.title}
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {t.features.items.map((feature) => (
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
            {t.stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl font-bold">{stat.value}</p>
                <p className="mt-1 text-sm text-[#1A1A1A]/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mb-16 rounded-2xl border border-[#1A1A1A]/10 bg-white px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold">
                {t.cta.title}
              </h2>
              <p className="mt-2 text-[#1A1A1A]/70">
                {t.cta.subtitle}
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6A00] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#E65C00]"
            >
              {t.cta.btn}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
