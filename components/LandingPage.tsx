import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Globe } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { BrandLogo } from '@/components/BrandLogo'
import { LandingJobCards, type LandingJob } from '@/components/LandingJobCards'
import { LandingPipeline } from '@/components/LandingPipeline'

type LandingLocale = 'pt' | 'en'

const content = {
  pt: {
    brandSubtitle: 'Vagas de Legal Ops',
    languageHref: '/en',
    languageLabel: 'English',
    languageCompact: 'EN',
    signIn: 'Entrar',
    heroEyebrow: 'Legal Ops',
    heroTitle: 'Legal Ops merece um lugar só seu.',
    heroDescription:
      'Você não deveria procurar vaga de Legal Ops no mesmo lugar que todo mundo procura vaga de tudo. A gente construiu o que faltava.',
    heroPrimaryCta: 'Começar agora',
    pipelineTitle: 'Seu processo, visível.',
    pipelineDescription:
      'Do primeiro interesse à oferta. Tudo organizado.',
    comparisonTitle: 'O que você leva em cada plano',
    comparisonHeaders: {
      feature: 'Funcionalidade',
      free: 'Grátis',
      pro: 'Pro',
    },
    comparisonRows: [
      ['Busca dedicada a Legal Ops', 'Incluído', 'Incluído'],
      ['Filtros por remoto, salário e prioridade', 'Incluído', 'Incluído'],
      ['Candidatura e acompanhamento de status', 'Incluído', 'Incluído'],
      ['Pipeline com notas e timeline', 'Incluído', 'Incluído'],
      ['Contatos e follow-ups', 'Incluído', 'Incluído'],
      ['Gestão de comunicação', 'Básica', 'Avançada'],
      ['Prep de entrevista com IA', '—', 'Incluído'],
      ['Cover letter com IA', '—', 'Incluído'],
    ],
    closingTitle: 'Feito pra quem constrói operações jurídicas.',
    closingDescription:
      'Comece grátis. Sem cartão, sem compromisso.',
    closingPrimaryCta: 'Começar agora',
  },
  en: {
    brandSubtitle: 'Legal Ops Jobs',
    languageHref: '/',
    languageLabel: 'Português',
    languageCompact: 'PT',
    signIn: 'Sign in',
    heroEyebrow: 'Legal Ops',
    heroTitle: 'Legal Ops deserves its own place.',
    heroDescription:
      'You shouldn\'t be searching for Legal Ops roles in the same place everyone searches for everything. We built what was missing.',
    heroPrimaryCta: 'Get started',
    pipelineTitle: 'Your process, visible.',
    pipelineDescription:
      'From first interest to offer. Everything organized.',
    comparisonTitle: 'What you get in each plan',
    comparisonHeaders: {
      feature: 'Feature',
      free: 'Free',
      pro: 'Pro',
    },
    comparisonRows: [
      ['Dedicated Legal Ops search', 'Included', 'Included'],
      ['Filters by remote, salary, and priority', 'Included', 'Included'],
      ['Apply and track status', 'Included', 'Included'],
      ['Pipeline with notes and timeline', 'Included', 'Included'],
      ['Contacts and follow-ups', 'Included', 'Included'],
      ['Communication management', 'Basic', 'Advanced'],
      ['AI interview prep', '—', 'Included'],
      ['AI cover letters', '—', 'Included'],
    ],
    closingTitle: 'Built for people who run legal operations.',
    closingDescription:
      'Start free. No credit card, no commitment.',
    closingPrimaryCta: 'Get started',
  },
} as const

const serifFont = {
  fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
}

export async function LandingPage({ locale }: { locale: LandingLocale }) {
  const copy = content[locale]
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  const { data: rawJobs } = await supabase
    .from('jobs')
    .select('id, title, company, remote_reality, salary_min, salary_max, salary_currency')
    .eq('enrichment_status', 'done')
    .order('created_at', { ascending: false })
    .limit(6)

  const jobs: LandingJob[] = (rawJobs ?? []).map(j => ({
    id: j.id,
    title: j.title,
    company: j.company,
    remote_reality: j.remote_reality,
    salary_min: j.salary_min,
    salary_max: j.salary_max,
    salary_currency: j.salary_currency,
  }))

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
        {/* Hero */}
        <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex rounded-full border border-stone-300 px-3 py-1 text-sm text-slate-600">
              {copy.heroEyebrow}
            </span>

            <h1
              className="mt-6 max-w-xl text-5xl leading-tight text-slate-950 sm:text-6xl"
              style={serifFont}
            >
              {copy.heroTitle}
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
              {copy.heroDescription}
            </p>

            <div className="mt-8">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                {copy.heroPrimaryCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <LandingJobCards locale={locale} jobs={jobs} />
        </section>

        {/* Pipeline */}
        <section className="mt-20">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <h2 className="text-4xl text-slate-950 sm:text-5xl" style={serifFont}>
              {copy.pipelineTitle}
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              {copy.pipelineDescription}
            </p>
          </div>
          <LandingPipeline locale={locale} />
        </section>

        {/* Comparison */}
        <section id="compare" className="mt-20">
          <h2 className="text-4xl text-slate-950 sm:text-5xl" style={serifFont}>
            {copy.comparisonTitle}
          </h2>

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

        {/* Closing CTA */}
        <section className="mt-20 rounded-[32px] border border-stone-200 bg-white px-6 py-10 sm:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-4xl text-slate-950 sm:text-5xl" style={serifFont}>
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
