import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Check, Globe } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { BrandLogo } from '@/components/BrandLogo'
import { LandingMotionCanvas } from '@/components/LandingMotionCanvas'

type LandingLocale = 'pt' | 'en'

const content = {
  pt: {
    brandSubtitle: 'Vagas de Legal Ops',
    languageHref: '/en',
    languageLabel: 'English',
    languageCompact: 'EN',
    signIn: 'Entrar',
    heroEyebrow: 'Legal Ops',
    heroTitle: 'Vagas de Legal Ops. Busca, pipeline e acompanhamento grátis.',
    heroDescription:
      'Busque vagas, candidate-se e acompanhe tudo em um só lugar. Grátis para o fluxo completo. Pro só para IA e outreach.',
    heroFocus: 'Legal Ops · CLM · Contract Ops',
    heroPrimaryCta: 'Criar conta grátis',
    heroSecondaryCta: 'Ver comparação',
    heroBullets: [
      'Busca e filtros de vagas',
      'Pipeline com status e notas',
      'Pro só se quiser IA',
    ],
    panel: {
      freeLabel: 'Grátis',
      freeTitle: 'Tudo que importa, liberado.',
      freeItems: [
        'Busca de vagas',
        'Pipeline, notas e contatos',
        'Dashboard e 1 alias',
      ],
      proLabel: 'Pro',
      proTitle: 'IA e mais alcance.',
      proItems: [
        'Prep de entrevista com IA',
        'Cover letter com IA',
        'Até 10 aliases',
      ],
    },
    comparisonTitle: 'Grátis vs Pro',
    comparisonDescription:
      'O que está incluído em cada plano.',
    comparisonHeaders: {
      feature: 'Funcionalidade',
      free: 'Grátis',
      pro: 'Pro',
    },
    comparisonRows: [
      ['Busca de vagas', 'Incluído', 'Incluído'],
      ['Filtros (remoto, salário, prioridade)', 'Incluído', 'Incluído'],
      ['Aplicar e atualizar status', 'Incluído', 'Incluído'],
      ['Pipeline, notas e timeline', 'Incluído', 'Incluído'],
      ['Contatos e follow-ups', 'Incluído', 'Incluído'],
      ['Email alias', '1 alias', '10 aliases'],
      ['Prep de entrevista com IA', '—', 'Incluído'],
      ['Cover letter com IA', '—', 'Incluído'],
    ],
    closingTitle: 'Comece grátis.',
    closingDescription:
      'Sem cartão. Upgrade quando quiser.',
    closingPrimaryCta: 'Começar grátis',
  },
  en: {
    brandSubtitle: 'Legal Ops Jobs',
    languageHref: '/',
    languageLabel: 'Português',
    languageCompact: 'PT',
    signIn: 'Sign in',
    heroEyebrow: 'Legal Ops',
    heroTitle: 'Legal Ops jobs. Search, pipeline, and tracking for free.',
    heroDescription:
      'Find jobs, apply, and track everything in one place. Free for the full flow. Pro only for AI and outreach.',
    heroFocus: 'Legal Ops · CLM · Contract Ops',
    heroPrimaryCta: 'Create free account',
    heroSecondaryCta: 'See comparison',
    heroBullets: [
      'Job search and filters',
      'Pipeline with status and notes',
      'Pro only if you want AI',
    ],
    panel: {
      freeLabel: 'Free',
      freeTitle: 'Everything that matters, unlocked.',
      freeItems: [
        'Job search',
        'Pipeline, notes, and contacts',
        'Dashboard and 1 alias',
      ],
      proLabel: 'Pro',
      proTitle: 'AI and more reach.',
      proItems: [
        'AI interview prep',
        'AI cover letters',
        'Up to 10 aliases',
      ],
    },
    comparisonTitle: 'Free vs Pro',
    comparisonDescription:
      'What\'s included in each plan.',
    comparisonHeaders: {
      feature: 'Feature',
      free: 'Free',
      pro: 'Pro',
    },
    comparisonRows: [
      ['Job search', 'Included', 'Included'],
      ['Filters (remote, salary, priority)', 'Included', 'Included'],
      ['Apply and update status', 'Included', 'Included'],
      ['Pipeline, notes, and timeline', 'Included', 'Included'],
      ['Contacts and follow-ups', 'Included', 'Included'],
      ['Email alias', '1 alias', '10 aliases'],
      ['AI interview prep', '—', 'Included'],
      ['AI cover letters', '—', 'Included'],
    ],
    closingTitle: 'Start free.',
    closingDescription:
      'No credit card. Upgrade when you want.',
    closingPrimaryCta: 'Start free',
  },
} as const

export async function LandingPage({ locale }: { locale: LandingLocale }) {
  const copy = content[locale]
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div lang={locale === 'pt' ? 'pt-BR' : 'en'} className="min-h-screen bg-stone-50 text-slate-950">
      <header className="border-b border-stone-200 bg-stone-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href={locale === 'pt' ? '/' : '/en'}>
            <BrandLogo
              className="flex items-center gap-3"
              markClassName="h-10 w-10 text-slate-950"
              subtitle={copy.brandSubtitle}
              subtitleClassName="hidden text-xs text-slate-500 sm:block"
            />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href={copy.languageHref}
              className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-3 py-2 text-sm text-slate-700 transition-colors hover:border-slate-950"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">{copy.languageLabel}</span>
              <span className="sm:hidden">{copy.languageCompact}</span>
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-950 hover:text-slate-950"
            >
              {copy.signIn}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <section className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div>
            <span className="inline-flex rounded-full border border-stone-300 px-3 py-1 text-sm text-slate-600">
              {copy.heroEyebrow}
            </span>

            <h1
              className="mt-6 max-w-4xl text-5xl leading-tight text-slate-950 sm:text-6xl"
              style={{
                fontFamily:
                  '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
              }}
            >
              {copy.heroTitle}
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              {copy.heroDescription}
            </p>

            <p className="mt-4 text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
              {copy.heroFocus}
            </p>

            <div className="mt-8 space-y-3">
              {copy.heroBullets.map(item => (
                <div key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                  <Check className="mt-1 h-4 w-4 flex-shrink-0 text-slate-950" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                {copy.heroPrimaryCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#compare"
                className="inline-flex items-center justify-center rounded-full border border-stone-300 px-6 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-950 hover:text-slate-950"
              >
                {copy.heroSecondaryCta}
              </a>
            </div>
          </div>

          <section className="relative min-h-[420px] overflow-hidden rounded-[32px] border border-stone-200 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_rgba(244,241,235,0.9))]">
            <LandingMotionCanvas />
            <div className="relative z-10 flex h-full flex-col justify-between p-6">
              <div className="grid gap-3">
                <article className="ml-auto max-w-sm rounded-[28px] border border-white/70 bg-white/82 p-5 backdrop-blur">
                  <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    {copy.panel.freeLabel}
                  </span>
                  <h2 className="mt-3 text-xl font-semibold text-slate-950">
                    {copy.panel.freeTitle}
                  </h2>
                  <div className="mt-4 space-y-2">
                    {copy.panel.freeItems.map(item => (
                      <div key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                        <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-600" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="max-w-sm rounded-[28px] bg-slate-950 p-5 text-white shadow-[0_20px_50px_-35px_rgba(15,23,42,0.8)]">
                  <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                    {copy.panel.proLabel}
                  </span>
                  <h2 className="mt-3 text-xl font-semibold">
                    {copy.panel.proTitle}
                  </h2>
                  <div className="mt-4 space-y-2">
                    {copy.panel.proItems.map(item => (
                      <div key={item} className="flex gap-3 text-sm leading-6 text-slate-200">
                        <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-300" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </div>
          </section>
        </section>

        <section id="compare" className="mt-20">
          <div className="max-w-3xl">
            <h2
              className="text-4xl text-slate-950 sm:text-5xl"
              style={{
                fontFamily:
                  '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
              }}
            >
              {copy.comparisonTitle}
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              {copy.comparisonDescription}
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-[28px] border border-stone-200 bg-white">
            <div className="grid gap-4 border-b border-stone-200 px-6 py-4 text-sm font-medium text-slate-500 sm:grid-cols-[1.5fr_0.7fr_0.7fr]">
              <div>{copy.comparisonHeaders.feature}</div>
              <div>{copy.comparisonHeaders.free}</div>
              <div>{copy.comparisonHeaders.pro}</div>
            </div>

            {copy.comparisonRows.map(([feature, free, pro], index) => (
              <div
                key={feature}
                className={`grid gap-4 px-6 py-4 text-sm sm:grid-cols-[1.5fr_0.7fr_0.7fr] ${
                  index % 2 === 0 ? 'bg-white' : 'bg-stone-50/70'
                }`}
              >
                <div className="font-medium text-slate-900">{feature}</div>
                <div className="text-slate-600">{free}</div>
                <div className="text-slate-600">{pro}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 rounded-[32px] border border-stone-200 bg-white px-6 py-10 sm:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <h2
                className="text-4xl text-slate-950 sm:text-5xl"
                style={{
                  fontFamily:
                    '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
                }}
              >
                {copy.closingTitle}
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-600">
                {copy.closingDescription}
              </p>
            </div>

            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              {copy.closingPrimaryCta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
