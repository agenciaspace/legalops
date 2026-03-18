'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, ArrowRight, Globe, ChevronDown } from 'lucide-react'
import { BrandMark } from '@/components/BrandLogo'

type Locale = 'pt' | 'en'

const content = {
  pt: {
    languageHref: '/en/pricing',
    languageLabel: 'English',
    languageCompact: 'EN',
    forEmployersLabel: 'Para Empresas',
    forEmployersHref: '/for-employers',
    signIn: 'Entrar',
    heroTitle: 'Planos para cada fase da sua carreira',
    heroDescription: 'De profissional iniciante a líder referência em Legal Ops.',
    forProfessionals: 'Para Profissionais',
    forEmployers: 'Para Empresas',
    forEmployersDescription: 'Encontre os melhores profissionais de Legal Ops do mercado.',
    ctaTitle: 'Comece grátis. Evolua quando quiser.',
    ctaDescription: 'Sem compromisso. Cancele a qualquer momento.',
    ctaCta: 'Criar conta grátis',
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
    ],
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
    ],
  },
  en: {
    languageHref: '/pricing',
    languageLabel: 'Português',
    languageCompact: 'PT',
    forEmployersLabel: 'For Employers',
    forEmployersHref: '/en/for-employers',
    signIn: 'Sign in',
    heroTitle: 'Plans for every stage of your career',
    heroDescription: 'From early-career professional to industry-leading Legal Ops expert.',
    forProfessionals: 'For Professionals',
    forEmployers: 'For Employers',
    forEmployersDescription: 'Find the best Legal Ops professionals on the market.',
    ctaTitle: 'Start free. Upgrade when you\'re ready.',
    ctaDescription: 'No commitment. Cancel anytime.',
    ctaCta: 'Create free account',
    professionalPlans: [
      {
        name: 'Free',
        price: '$0',
        period: '/mo',
        description: 'For those starting out in Legal Ops.',
        features: [
          'Public professional profile',
          'Job discovery (basic feed)',
          '1 email alias',
          'Access to professional directory',
        ],
        cta: 'Start free',
        href: '/login',
        highlight: false,
      },
      {
        name: 'Pro',
        price: '$29',
        period: '/mo',
        description: 'For professionals looking to accelerate their career.',
        features: [
          'Everything in Free +',
          'Full pipeline (Kanban)',
          '10 email aliases',
          'Unlimited AI Interview Prep',
          'Unlimited AI Cover Letter',
          'Personalized job alerts',
          'Featured profile in directory',
          'Automatic match score with jobs',
        ],
        cta: 'Subscribe to Pro',
        href: '/login',
        highlight: true,
      },
      {
        name: 'Expert',
        price: '$99',
        period: '/mo',
        description: 'For leaders and industry references.',
        features: [
          'Everything in Pro +',
          'Publish articles/insights',
          'Unlimited email aliases',
          'Personal AI research agent',
          'Verified "Expert" badge',
          'Early access to premium jobs',
          'Exclusive event invitations',
        ],
        cta: 'Subscribe to Expert',
        href: '/login',
        highlight: false,
      },
    ],
    employerPlans: [
      {
        name: 'Job Post',
        price: '$299',
        period: '/job',
        description: 'Post jobs and reach qualified professionals.',
        features: [
          '1 job posting',
          '30-day visibility',
          'Up to 50 candidates',
          'AI-enriched description',
          'Basic automatic matching',
        ],
        cta: 'Post a job',
        href: '/en/for-employers',
        highlight: false,
      },
      {
        name: 'Talent Access',
        price: '$999',
        period: '/mo',
        description: 'Full access to the Legal Ops talent pool.',
        features: [
          'Unlimited job posts',
          'Advanced AI matching',
          'Advanced candidate filters',
          'Direct contact with professionals',
          'Metrics dashboard',
          'ATS integration',
        ],
        cta: 'Get this plan',
        href: '/en/for-employers',
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
        href: '/en/for-employers',
        highlight: false,
      },
    ],
  },
}

type Plan = {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  href: string
  highlight: boolean
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div
      className={`flex flex-col rounded-2xl border p-6 ${
        plan.highlight
          ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-xl'
          : 'border-[#1A1A1A]/10 bg-white'
      }`}
    >
      <h3 className="text-lg font-semibold">{plan.name}</h3>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-4xl font-bold">{plan.price}</span>
        {plan.period && (
          <span className={plan.highlight ? 'text-white/40' : 'text-[#1A1A1A]/50'}>
            {plan.period}
          </span>
        )}
      </div>
      <p
        className={`mt-3 text-sm ${
          plan.highlight ? 'text-white/60' : 'text-[#1A1A1A]/60'
        }`}
      >
        {plan.description}
      </p>
      <ul className="mt-6 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <Check
              className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                plan.highlight ? 'text-emerald-400' : 'text-emerald-600'
              }`}
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        href={plan.href}
        className={`mt-6 flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-bold transition-colors ${
          plan.highlight
            ? 'bg-white text-[#1A1A1A] hover:bg-white/90'
            : 'bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/80'
        }`}
      >
        {plan.cta}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

export function PricingPage({ locale }: { locale: Locale }) {
  const [lang, setLang] = useState<Locale>(locale)
  const copy = content[lang]

  return (
    <div lang={lang === 'pt' ? 'pt-BR' : 'en'} className="min-h-screen bg-[#F5F4F0] text-[#1A1A1A]">
      <header className="border-b border-[#1A1A1A]/5 bg-[#F5F4F0]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href={lang === 'pt' ? '/' : '/en'} className="flex items-center gap-3">
            <BrandMark className="h-8 w-8 md:h-10 md:w-10 text-[#FF6A00]" />
            <span className="font-bold text-xl md:text-2xl tracking-tight text-[#1A1A1A]">
              legalops.work
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={copy.forEmployersHref}
              className="hidden sm:inline-flex text-sm font-medium text-[#1A1A1A]/70 hover:text-[#FF6A00] transition-colors"
            >
              {copy.forEmployersLabel}
            </Link>
            <button
              onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors"
            >
              <Globe className="h-4 w-4" />
              <span className="uppercase">{lang}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            <Link
              href="/login"
              className="bg-[#1A1A1A] hover:bg-[#1A1A1A]/80 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors"
            >
              {copy.signIn}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-16">
        {/* Hero */}
        <div className="text-center">
          <h1
            className="text-4xl sm:text-5xl"
            style={{
              fontFamily:
                '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
            }}
          >
            {copy.heroTitle}
          </h1>
          <p className="mt-4 text-lg text-[#1A1A1A]/60">
            {copy.heroDescription}
          </p>
        </div>

        {/* Professional Plans */}
        <section className="mt-12">
          <h2 className="text-center text-xs font-semibold uppercase tracking-widest text-[#1A1A1A]/40">
            {copy.forProfessionals}
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {copy.professionalPlans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </div>
        </section>

        {/* Employer Plans */}
        <section className="mt-20">
          <h2 className="text-center text-xs font-semibold uppercase tracking-widest text-[#1A1A1A]/40">
            {copy.forEmployers}
          </h2>
          <p className="mt-2 text-center text-lg text-[#1A1A1A]/60">
            {copy.forEmployersDescription}
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {copy.employerPlans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-20 rounded-2xl border border-[#1A1A1A]/10 bg-white px-6 py-8 text-center sm:px-8">
          <h2
            className="text-3xl"
            style={{
              fontFamily:
                '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
            }}
          >
            {copy.ctaTitle}
          </h2>
          <p className="mt-3 text-[#1A1A1A]/60">
            {copy.ctaDescription}
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-[#1A1A1A] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1A1A1A]/80"
          >
            {copy.ctaCta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    </div>
  )
}
