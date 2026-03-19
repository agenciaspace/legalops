'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Check, ArrowRight, Globe, ChevronDown } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'

type Locale = 'pt' | 'en'

interface Plan {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  href: string
  highlight: boolean
}

const content = {
  pt: {
    nav: { companies: 'Para Empresas', login: 'Entrar' },
    hero: {
      title: 'Planos para cada fase da sua carreira',
      subtitle: 'De profissional iniciante a líder referência em Legal Ops.',
    },
    proLabel: 'Para Profissionais',
    compLabel: 'Para Empresas',
    compSubtitle: 'Encontre os melhores profissionais de Legal Ops do mercado.',
    cta: {
      title: 'Comece grátis. Evolua quando quiser.',
      subtitle: 'Sem compromisso. Cancele a qualquer momento.',
      btn: 'Criar conta grátis',
    },
    professionalPlans: [
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
    ] as Plan[],
    employerPlans: [
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
    ] as Plan[],
  },
  en: {
    nav: { companies: 'For Companies', login: 'Sign in' },
    hero: {
      title: 'Plans for every stage of your career',
      subtitle: 'From entry-level professional to leading reference in Legal Ops.',
    },
    proLabel: 'For Professionals',
    compLabel: 'For Companies',
    compSubtitle: 'Find the best Legal Ops professionals on the market.',
    cta: {
      title: 'Start free. Upgrade when you are ready.',
      subtitle: 'No commitment. Cancel anytime.',
      btn: 'Create free account',
    },
    professionalPlans: [
      {
        name: 'Free',
        price: '$0',
        period: '/month',
        description: 'For those entering the Legal Ops field.',
        features: [
          'Public professional profile',
          'Job discovery (basic feed)',
          '1 email alias',
          'Access to the professional directory',
        ],
        cta: 'Start for free',
        href: '/login',
        highlight: false,
      },
      {
        name: 'Pro',
        price: '$29',
        period: '/month',
        description: 'For professionals looking to accelerate their career.',
        features: [
          'Everything in Free +',
          'Full pipeline (Kanban)',
          '10 email aliases',
          'Unlimited AI Interview Prep',
          'Unlimited AI Cover Letter',
          'Custom job alerts',
          'Featured profile in directory',
          'Auto match score with jobs',
        ],
        cta: 'Subscribe Pro',
        href: '/login',
        highlight: true,
      },
      {
        name: 'Expert',
        price: '$99',
        period: '/month',
        description: 'For leaders and market references.',
        features: [
          'Everything in Pro +',
          'Publish articles/insights',
          'Unlimited email aliases',
          'Personal AI research agent',
          'Verified "Expert" badge',
          'Early access to premium jobs',
          'Invite to exclusive events',
        ],
        cta: 'Subscribe Expert',
        href: '/login',
        highlight: false,
      },
    ] as Plan[],
    employerPlans: [
      {
        name: 'Job Post',
        price: '$299',
        period: '/post',
        description: 'Post jobs and reach qualified professionals.',
        features: [
          '1 job posting',
          '30-day visibility',
          'Up to 50 candidates',
          'AI-enriched description',
          'Basic auto matching',
        ],
        cta: 'Post a job',
        href: '/for-employers',
        highlight: false,
      },
      {
        name: 'Talent Access',
        price: '$999',
        period: '/month',
        description: 'Full access to the Legal Ops talent pool.',
        features: [
          'Unlimited job posts',
          'Advanced AI auto matching',
          'Advanced candidate filters',
          'Direct contact with professionals',
          'Metrics dashboard',
          'ATS integration',
        ],
        cta: 'Get Talent Access',
        href: '/for-employers',
        highlight: true,
      },
      {
        name: 'Enterprise',
        price: 'Custom',
        period: '',
        description: 'For large-scale legal recruitment operations.',
        features: [
          'Everything in Talent Access +',
          'Integration API',
          'Dedicated account manager',
          'Employer branding page',
          'Advanced analytics',
          'Support SLA',
        ],
        cta: 'Talk to sales',
        href: '/for-employers',
        highlight: false,
      },
    ] as Plan[],
  },
} as const

function PlanCard({ plan }: { plan: Plan }) {
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
              href="/for-employers"
              className="rounded-xl border-2 border-[#1A1A1A] px-4 py-2 text-sm font-bold text-[#1A1A1A] transition-colors hover:bg-[#1A1A1A]/5"
            >
              {t.nav.companies}
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

      <main className="mx-auto max-w-6xl px-6 py-16">
        {/* Hero */}
        <div className="text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">
            {t.hero.title}
          </h1>
          <p className="mt-4 text-lg text-[#1A1A1A]/70">
            {t.hero.subtitle}
          </p>
        </div>

        {/* Professional Plans */}
        <section className="mt-12">
          <h2 className="text-center text-xs font-semibold uppercase tracking-widest text-[#1A1A1A]/50">
            {t.proLabel}
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {t.professionalPlans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </div>
        </section>

        {/* Employer Plans */}
        <section className="mt-20">
          <h2 className="text-center text-xs font-semibold uppercase tracking-widest text-[#1A1A1A]/50">
            {t.compLabel}
          </h2>
          <p className="mt-2 text-center text-lg text-[#1A1A1A]/70">
            {t.compSubtitle}
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {t.employerPlans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-20 rounded-2xl border border-[#1A1A1A]/10 bg-white px-6 py-8 text-center sm:px-8">
          <h2 className="text-3xl font-bold">
            {t.cta.title}
          </h2>
          <p className="mt-3 text-[#1A1A1A]/70">
            {t.cta.subtitle}
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6A00] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#E65C00]"
          >
            {t.cta.btn}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    </div>
  )
}
