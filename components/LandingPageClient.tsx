'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Search,
  Briefcase,
  MapPin,
  Building,
  Menu,
  X,
  ArrowRight,
  Globe,
  ChevronDown,
  Check,
  Sparkles,
  Bell,
  ExternalLink,
} from 'lucide-react'
import { BrandMark } from '@/components/BrandLogo'
import type { RemoteReality, UrlStatus } from '@/lib/types'

type LandingLocale = 'pt' | 'en'

export interface LandingJob {
  id: string
  title: string
  company: string
  url: string
  remote_reality: string | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  url_status: string | null
  created_at: string
}

const remoteLabels: Record<RemoteReality, Record<LandingLocale, string>> = {
  fully_remote: { pt: 'Remoto', en: 'Remote' },
  remote_with_travel: { pt: 'Remoto + Viagem', en: 'Remote + Travel' },
  hybrid_disguised: { pt: 'Híbrido', en: 'Hybrid' },
  onsite: { pt: 'Presencial', en: 'On-site' },
  unknown: { pt: '—', en: '—' },
}

const content = {
  pt: {
    nav: {
      jobs: 'Vagas',
      talents: 'Talentos',
      companies: 'Empresas',
      login: 'Entrar',
      postJob: 'Anunciar Vaga',
      pricing: 'Ver planos',
      notifications: '{count} novas vagas via IA/Scraper',
    },
    hero: {
      title1: 'Legal Ops',
      title2: 'is not a job title.',
      subtitle: "It's a movement.",
      searchRole: 'Cargo, palavra-chave...',
      searchLocation: 'Localização...',
      searchBtn: 'Buscar',
      trending: 'Buscas em alta:',
      remote: 'Remoto',
    },
    jobs: {
      title: 'Últimas Oportunidades',
      subtitle: 'Curadoria focada em operações e tecnologia jurídica.',
      viewAll: 'Ver todas as vagas',
      new: 'Novo',
      fulltime: 'Tempo Inteiro',
      empty: 'Nenhuma vaga encontrada no momento.',
    },
    pricing: {
      title: 'Planos & Preços',
      subtitle: 'Escolha o acesso ideal para o seu momento no movimento.',
      tabPro: 'Para Profissionais',
      tabComp: 'Para Empresas',
      pro: {
        free: {
          name: 'Básico',
          price: 'Grátis',
          desc: 'Para quem está a entrar na área.',
          features: [
            'Perfil na pool de talentos',
            'Candidatura a vagas públicas',
            'Alertas de vagas semanais',
          ],
        },
        premium: {
          name: 'Pro AI',
          price: 'R$ 49/mês',
          desc: 'Acelere a sua carreira com inteligência artificial.',
          features: [
            'Análise de currículo por IA',
            'Simulação de entrevistas com IA',
            'Match prioritário com empresas',
            'Acesso antecipado a vagas ocultas',
          ],
        },
      },
      comp: {
        single: {
          name: 'Por Vaga',
          price: 'R$ 290',
          desc: 'Encontre o talento exato para a sua necessidade pontual.',
          features: [
            '1 Anúncio por 30 dias',
            'Algoritmo de Match Ideal (IA)',
            'Acesso aos perfis compatíveis',
            'Suporte por email',
          ],
        },
        unlimited: {
          name: 'Acesso Total',
          price: 'R$ 990/mês',
          desc: 'Para empresas focadas em escalar a sua operação.',
          features: [
            'Anúncios ilimitados',
            'Busca ativa via IA na pool de talentos',
            'Gestão de pipeline integrada',
            'Gerente de sucesso dedicado',
          ],
        },
      },
      btnFree: 'Criar Perfil Grátis',
      btnPremium: 'Assinar Pro AI',
      btnComp: 'Publicar Vaga',
      btnCompSub: 'Falar com Vendas',
    },
    cta: {
      title: 'Faça parte do movimento.',
      subtitle:
        'Crie o seu perfil profissional ou encontre o talento ideal para revolucionar o seu departamento jurídico.',
      proBtn: 'Sou Profissional',
      compBtn: 'Sou Empresa',
    },
    footer: { about: 'Sobre', privacy: 'Privacidade', contact: 'Contacto' },
  },
  en: {
    nav: {
      jobs: 'Jobs',
      talents: 'Talents',
      companies: 'Companies',
      login: 'Sign in',
      postJob: 'Post a Job',
      pricing: 'View plans',
      notifications: '{count} new jobs via AI/Scraper',
    },
    hero: {
      title1: 'Legal Ops',
      title2: 'is not a job title.',
      subtitle: "It's a movement.",
      searchRole: 'Job title, keyword...',
      searchLocation: 'Location...',
      searchBtn: 'Search',
      trending: 'Trending searches:',
      remote: 'Remote',
    },
    jobs: {
      title: 'Latest Opportunities',
      subtitle: 'Curated jobs focused on legal operations and tech.',
      viewAll: 'View all jobs',
      new: 'New',
      fulltime: 'Full-time',
      empty: 'No jobs found at the moment.',
    },
    pricing: {
      title: 'Plans & Pricing',
      subtitle: 'Choose the ideal access for your stage in the movement.',
      tabPro: 'For Professionals',
      tabComp: 'For Companies',
      pro: {
        free: {
          name: 'Basic',
          price: 'Free',
          desc: 'For those entering the field.',
          features: [
            'Profile in the talent pool',
            'Apply to public jobs',
            'Weekly job alerts',
          ],
        },
        premium: {
          name: 'Pro AI',
          price: '$9/month',
          desc: 'Accelerate your career with artificial intelligence.',
          features: [
            'AI resume analysis',
            'AI interview simulation',
            'Priority match with companies',
            'Early access to hidden jobs',
          ],
        },
      },
      comp: {
        single: {
          name: 'Single Post',
          price: '$59',
          desc: 'Find the exact talent for your specific need.',
          features: [
            '1 Job post for 30 days',
            'Ideal Match Algorithm (AI)',
            'Access to compatible profiles',
            'Email support',
          ],
        },
        unlimited: {
          name: 'All Access',
          price: '$199/month',
          desc: 'For companies focused on scaling operations.',
          features: [
            'Unlimited job posts',
            'Active AI search in talent pool',
            'Integrated pipeline management',
            'Dedicated success manager',
          ],
        },
      },
      btnFree: 'Create Free Profile',
      btnPremium: 'Subscribe Pro AI',
      btnComp: 'Post a Job',
      btnCompSub: 'Talk to Sales',
    },
    cta: {
      title: 'Join the movement.',
      subtitle:
        'Create your professional profile or find the ideal talent to revolutionize your legal department.',
      proBtn: 'I am a Professional',
      compBtn: 'I am a Company',
    },
    footer: { about: 'About', privacy: 'Privacy', contact: 'Contact' },
  },
} as const

function companyInitial(company: string): string {
  return company.charAt(0).toUpperCase()
}

const companyColors = [
  'bg-[#1A1A1A]',
  'bg-blue-600',
  'bg-emerald-600',
  'bg-violet-600',
  'bg-rose-600',
  'bg-amber-600',
  'bg-cyan-600',
  'bg-indigo-600',
]

function companyColor(company: string): string {
  let hash = 0
  for (let i = 0; i < company.length; i++) {
    hash = company.charCodeAt(i) + ((hash << 5) - hash)
  }
  return companyColors[Math.abs(hash) % companyColors.length]
}

function isRecent(createdAt: string): boolean {
  const diff = Date.now() - new Date(createdAt).getTime()
  return diff < 7 * 24 * 60 * 60 * 1000 // 7 days
}

export function LandingPageClient({
  locale,
  jobs,
  jobCount,
}: {
  locale: LandingLocale
  jobs: LandingJob[]
  jobCount: number
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [lang, setLang] = useState<LandingLocale>(locale)
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false)
  const [pricingTab, setPricingTab] = useState<'pro' | 'comp'>('pro')
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

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

  const currentLang = content[lang]
  const displayJobs = jobs.slice(0, 6)

  return (
    <div
      lang={lang === 'pt' ? 'pt-BR' : 'en'}
      className="min-h-screen bg-[#F5F4F0] font-sans text-[#1A1A1A] selection:bg-[#FF6A00] selection:text-white"
    >
      {/* NAVIGATION */}
      <nav className="fixed w-full z-50 bg-[#F5F4F0]/95 backdrop-blur-md border-b border-[#1A1A1A]/5 md:border-transparent transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 md:h-24">
            {/* Logo */}
            <Link
              href={lang === 'pt' ? '/' : '/en'}
              className="flex items-center gap-2 sm:gap-3 relative z-50"
            >
              <BrandMark className="w-8 h-8 md:w-10 md:h-10 text-[#FF6A00]" />
              <span className="font-bold text-xl md:text-2xl tracking-tight text-[#1A1A1A]">
                legalops.work
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <a
                href="#jobs"
                className="text-sm font-medium text-[#1A1A1A]/70 hover:text-[#FF6A00] transition-colors"
              >
                {currentLang.nav.jobs}
              </a>
              <a
                href="#pricing"
                className="text-sm font-medium text-[#1A1A1A]/70 hover:text-[#FF6A00] transition-colors"
              >
                {currentLang.nav.pricing}
              </a>
              <Link
                href="/for-employers"
                className="text-sm font-medium text-[#1A1A1A]/70 hover:text-[#FF6A00] transition-colors"
              >
                {currentLang.nav.companies}
              </Link>
              <div className="h-4 w-px bg-[#1A1A1A]/10 mx-1" />

              {/* Notifications Desktop */}
              {jobCount > 0 && (
                <button
                  className="relative flex items-center justify-center p-1.5 rounded-lg text-[#1A1A1A]/70 hover:text-[#FF6A00] transition-colors"
                  title={currentLang.nav.notifications.replace('{count}', String(jobCount))}
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF6A00] text-[9px] font-bold text-white shadow-sm ring-2 ring-[#F5F4F0] translate-x-1/4 -translate-y-1/4">
                    {jobCount > 99 ? '99+' : jobCount}
                  </span>
                </button>
              )}

              {/* Language Switcher Desktop */}
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
                  <div className="absolute top-full right-0 mt-2 w-24 bg-white border border-[#1A1A1A]/10 rounded-lg shadow-lg py-1 overflow-hidden">
                    <button
                      onClick={() => {
                        setLang('pt')
                        setIsLangMenuOpen(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-[#F5F4F0] transition-colors ${lang === 'pt' ? 'font-bold text-[#FF6A00]' : 'text-[#1A1A1A]/70'}`}
                    >
                      PT
                    </button>
                    <button
                      onClick={() => {
                        setLang('en')
                        setIsLangMenuOpen(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-[#F5F4F0] transition-colors ${lang === 'en' ? 'font-bold text-[#FF6A00]' : 'text-[#1A1A1A]/70'}`}
                    >
                      EN
                    </button>
                  </div>
                )}
              </div>

              <Link
                href="/login"
                className="text-sm font-bold text-[#1A1A1A] hover:text-[#FF6A00] transition-colors"
              >
                {currentLang.nav.login}
              </Link>
              <Link
                href="/for-employers"
                className="bg-[#FF6A00] hover:bg-[#E65C00] text-white px-6 py-3 rounded-lg text-sm font-bold transition-colors"
              >
                {currentLang.nav.postJob}
              </Link>
            </div>

            {/* Mobile Controls */}
            <div className="md:hidden flex items-center gap-1 sm:gap-2 relative z-50">
              {jobCount > 0 && (
                <button
                  className="relative flex items-center justify-center p-2 rounded-lg text-[#1A1A1A]/70 hover:bg-[#1A1A1A]/5 transition-colors"
                  title={currentLang.nav.notifications.replace('{count}', String(jobCount))}
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#FF6A00] text-[8px] font-bold text-white shadow-sm ring-2 ring-[#F5F4F0]">
                    {jobCount > 99 ? '99+' : jobCount}
                  </span>
                </button>
              )}
              <button
                onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
                className="flex items-center justify-center p-2 rounded-lg text-[#1A1A1A]/70 hover:bg-[#1A1A1A]/5 transition-colors"
                aria-label="Toggle language"
              >
                <Globe className="w-5 h-5" />
                <span className="text-xs font-bold uppercase ml-1 hidden sm:inline">{lang}</span>
              </button>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 -mr-1 text-[#1A1A1A] hover:bg-[#1A1A1A]/5 rounded-lg transition-colors"
                aria-label="Main menu"
              >
                {isMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Overlay */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 top-20 bg-[#F5F4F0] z-40 overflow-y-auto">
            <div className="flex flex-col px-6 py-8 space-y-2 h-full">
              <a
                href="#jobs"
                onClick={() => setIsMenuOpen(false)}
                className="block py-3 text-2xl font-medium text-[#1A1A1A] border-b border-[#1A1A1A]/5"
              >
                {currentLang.nav.jobs}
              </a>
              <a
                href="#pricing"
                onClick={() => setIsMenuOpen(false)}
                className="block py-3 text-2xl font-medium text-[#1A1A1A] border-b border-[#1A1A1A]/5"
              >
                {currentLang.nav.pricing}
              </a>
              <Link
                href="/for-employers"
                className="block py-3 text-2xl font-medium text-[#1A1A1A] border-b border-[#1A1A1A]/5"
              >
                {currentLang.nav.companies}
              </Link>
              <div className="pt-8 mt-auto flex flex-col gap-4">
                <Link
                  href="/login"
                  className="w-full text-center block py-4 text-xl font-bold text-[#1A1A1A] border-2 border-[#1A1A1A] rounded-xl hover:bg-[#1A1A1A]/5 transition-colors"
                >
                  {currentLang.nav.login}
                </Link>
                <Link
                  href="/for-employers"
                  className="w-full text-center bg-[#FF6A00] text-white px-6 py-4 rounded-xl text-xl font-bold shadow-lg shadow-[#FF6A00]/20 active:scale-[0.98] transition-all"
                >
                  {currentLang.nav.postJob}
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <section className="pt-32 pb-16 md:pt-48 md:pb-24 lg:pt-56 lg:pb-32 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl">
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-[5.5rem] font-medium tracking-tight text-[#1A1A1A] leading-[1.1] mb-1 md:mb-2">
              {currentLang.hero.title1} <br className="hidden sm:block" />
              {currentLang.hero.title2}
            </h1>
            <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-[5.5rem] font-medium tracking-tight text-[#FF6A00] leading-[1.1] mb-10 md:mb-16">
              {currentLang.hero.subtitle}
            </h2>

            {/* Search Box */}
            <div className="bg-white p-2 flex flex-col md:flex-row gap-2 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#1A1A1A]/5 max-w-3xl">
              <div className="flex-1 flex items-center px-4 py-3.5 md:py-4 border-b md:border-b-0 md:border-r border-[#1A1A1A]/10">
                <Search className="w-5 h-5 text-[#1A1A1A]/40 mr-3 flex-shrink-0" />
                <input
                  type="text"
                  placeholder={currentLang.hero.searchRole}
                  className="w-full bg-transparent focus:outline-none text-[#1A1A1A] placeholder-[#1A1A1A]/40 font-medium text-base md:text-lg"
                />
              </div>
              <div className="flex-1 flex items-center px-4 py-3.5 md:py-4">
                <MapPin className="w-5 h-5 text-[#1A1A1A]/40 mr-3 flex-shrink-0" />
                <input
                  type="text"
                  placeholder={currentLang.hero.searchLocation}
                  className="w-full bg-transparent focus:outline-none text-[#1A1A1A] placeholder-[#1A1A1A]/40 font-medium text-base md:text-lg"
                />
              </div>
              <button className="bg-[#1A1A1A] hover:bg-black text-white px-8 py-4 md:py-4 rounded-xl font-bold transition-colors w-full md:w-auto flex items-center justify-center gap-2 mt-1 md:mt-0 active:scale-[0.98]">
                {currentLang.hero.searchBtn}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Trending Searches */}
            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs md:text-sm font-medium text-[#1A1A1A]/60">
              <span className="hidden sm:inline">{currentLang.hero.trending}</span>
              <a
                href="#"
                className="hover:text-[#FF6A00] transition-colors py-1 px-3 bg-[#1A1A1A]/5 rounded-full sm:p-0 sm:bg-transparent sm:rounded-none"
              >
                Head of Legal Ops
              </a>
              <span className="hidden sm:block w-1 h-1 rounded-full bg-[#1A1A1A]/20" />
              <a
                href="#"
                className="hover:text-[#FF6A00] transition-colors py-1 px-3 bg-[#1A1A1A]/5 rounded-full sm:p-0 sm:bg-transparent sm:rounded-none"
              >
                Legal Tech
              </a>
              <span className="hidden sm:block w-1 h-1 rounded-full bg-[#1A1A1A]/20" />
              <a
                href="#"
                className="hover:text-[#FF6A00] transition-colors py-1 px-3 bg-[#1A1A1A]/5 rounded-full sm:p-0 sm:bg-transparent sm:rounded-none"
              >
                {currentLang.hero.remote}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* JOBS SECTION */}
      <section id="jobs" className="py-16 md:py-24 bg-white border-t border-[#1A1A1A]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 md:mb-12 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight text-[#1A1A1A] mb-2">
                {currentLang.jobs.title}
              </h2>
              <p className="text-[#1A1A1A]/60 text-base md:text-lg">
                {currentLang.jobs.subtitle}
              </p>
            </div>
            <Link
              href="/login"
              className="hidden sm:flex items-center text-[#1A1A1A] font-bold hover:text-[#FF6A00] transition-colors gap-2 group whitespace-nowrap"
            >
              {currentLang.jobs.viewAll}{' '}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {displayJobs.length > 0 ? (
            <div className="grid gap-4">
              {displayJobs.map((job) => {
                const isDead = (job.url_status as UrlStatus) === 'dead'
                const remoteInfo =
                  remoteLabels[job.remote_reality as RemoteReality]?.[lang] ?? '—'
                return (
                  <a
                    key={job.id}
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group border border-[#1A1A1A]/10 hover:border-[#FF6A00] bg-white p-5 md:p-8 rounded-2xl transition-all cursor-pointer flex flex-row gap-4 md:gap-6 items-start md:items-center ${isDead ? 'opacity-60' : ''}`}
                  >
                    <div
                      className={`w-12 h-12 md:w-16 md:h-16 ${companyColor(job.company)} rounded-xl flex items-center justify-center text-white font-bold text-xl md:text-2xl flex-shrink-0`}
                    >
                      {companyInitial(job.company)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1.5 md:mb-2">
                        <h3 className="text-lg md:text-xl font-bold text-[#1A1A1A] group-hover:text-[#FF6A00] transition-colors truncate w-full sm:w-auto">
                          {job.title}
                        </h3>
                        {isRecent(job.created_at) && (
                          <span className="bg-[#F5F4F0] text-[#1A1A1A] text-[10px] md:text-xs font-bold px-2.5 py-0.5 md:px-3 md:py-1 rounded-full border border-[#1A1A1A]/10">
                            {currentLang.jobs.new}
                          </span>
                        )}
                        <ExternalLink className="hidden sm:block h-3.5 w-3.5 text-[#1A1A1A]/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 md:gap-4 text-xs md:text-sm text-[#1A1A1A]/60 font-medium">
                        <span className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5" /> {job.company}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {remoteInfo}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5" /> {currentLang.jobs.fulltime}
                        </span>
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          ) : (
            <p className="text-[#1A1A1A]/50 text-base">{currentLang.jobs.empty}</p>
          )}

          {/* Mobile view all button */}
          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/login"
              className="w-full inline-flex py-4 rounded-xl border border-[#1A1A1A]/20 text-[#1A1A1A] font-bold active:bg-[#1A1A1A]/5 items-center justify-center gap-2"
            >
              {currentLang.jobs.viewAll} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-16 md:py-24 bg-[#F5F4F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-[#1A1A1A] mb-4">
              {currentLang.pricing.title}
            </h2>
            <p className="text-base md:text-lg text-[#1A1A1A]/60 px-4">
              {currentLang.pricing.subtitle}
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex justify-center mb-10 md:mb-16">
            <div className="bg-[#1A1A1A]/5 p-1.5 rounded-2xl inline-flex w-full sm:w-auto relative z-10">
              <button
                onClick={() => setPricingTab('pro')}
                className={`flex-1 sm:flex-none px-4 sm:px-8 md:px-10 py-3.5 md:py-4 rounded-xl text-sm md:text-base font-bold transition-all ${pricingTab === 'pro' ? 'bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)] text-[#1A1A1A]' : 'text-[#1A1A1A]/50 hover:text-[#1A1A1A]'}`}
              >
                {currentLang.pricing.tabPro}
              </button>
              <button
                onClick={() => setPricingTab('comp')}
                className={`flex-1 sm:flex-none px-4 sm:px-8 md:px-10 py-3.5 md:py-4 rounded-xl text-sm md:text-base font-bold transition-all ${pricingTab === 'comp' ? 'bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)] text-[#1A1A1A]' : 'text-[#1A1A1A]/50 hover:text-[#1A1A1A]'}`}
              >
                {currentLang.pricing.tabComp}
              </button>
            </div>
          </div>

          {/* Professional Plans */}
          {pricingTab === 'pro' && (
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="bg-white border border-[#1A1A1A]/10 rounded-2xl p-8 md:p-10 flex flex-col transition-all hover:border-[#1A1A1A]/30">
                <h3 className="text-2xl font-bold text-[#1A1A1A] mb-2">
                  {currentLang.pricing.pro.free.name}
                </h3>
                <div className="text-4xl font-medium tracking-tight text-[#1A1A1A] mb-4">
                  {currentLang.pricing.pro.free.price}
                </div>
                <p className="text-[#1A1A1A]/60 mb-8 sm:h-12">
                  {currentLang.pricing.pro.free.desc}
                </p>
                <div className="flex-1 space-y-4 mb-8">
                  {currentLang.pricing.pro.free.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#1A1A1A]/40 flex-shrink-0 mt-0.5" />
                      <span className="text-[#1A1A1A]/80 font-medium text-sm md:text-base">
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/login"
                  className="w-full py-4 rounded-xl border-2 border-[#1A1A1A] text-[#1A1A1A] font-bold hover:bg-[#1A1A1A]/5 transition-colors active:scale-[0.98] text-center block"
                >
                  {currentLang.pricing.btnFree}
                </Link>
              </div>

              <div className="bg-white border-2 border-[#FF6A00] rounded-2xl p-8 md:p-10 flex flex-col relative shadow-[0_8px_30px_rgba(255,106,0,0.08)]">
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-[#FF6A00] text-white px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />{' '}
                  {lang === 'pt' ? 'Recomendado' : 'Recommended'}
                </div>
                <h3 className="text-2xl font-bold text-[#1A1A1A] mb-2">
                  {currentLang.pricing.pro.premium.name}
                </h3>
                <div className="text-4xl font-medium tracking-tight text-[#1A1A1A] mb-4">
                  {currentLang.pricing.pro.premium.price}
                </div>
                <p className="text-[#1A1A1A]/60 mb-8 sm:h-12">
                  {currentLang.pricing.pro.premium.desc}
                </p>
                <div className="flex-1 space-y-4 mb-8">
                  {currentLang.pricing.pro.premium.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#FF6A00] flex-shrink-0 mt-0.5" />
                      <span className="text-[#1A1A1A]/80 font-medium text-sm md:text-base">
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/login"
                  className="w-full py-4 rounded-xl bg-[#FF6A00] text-white font-bold hover:bg-[#E65C00] transition-colors shadow-lg shadow-[#FF6A00]/20 active:scale-[0.98] text-center block"
                >
                  {currentLang.pricing.btnPremium}
                </Link>
              </div>
            </div>
          )}

          {/* Company Plans */}
          {pricingTab === 'comp' && (
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="bg-white border border-[#1A1A1A]/10 rounded-2xl p-8 md:p-10 flex flex-col transition-all hover:border-[#1A1A1A]/30">
                <h3 className="text-2xl font-bold text-[#1A1A1A] mb-2">
                  {currentLang.pricing.comp.single.name}
                </h3>
                <div className="text-4xl font-medium tracking-tight text-[#1A1A1A] mb-4">
                  {currentLang.pricing.comp.single.price}
                </div>
                <p className="text-[#1A1A1A]/60 mb-8 sm:h-12">
                  {currentLang.pricing.comp.single.desc}
                </p>
                <div className="flex-1 space-y-4 mb-8">
                  {currentLang.pricing.comp.single.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#1A1A1A]/40 flex-shrink-0 mt-0.5" />
                      <span className="text-[#1A1A1A]/80 font-medium text-sm md:text-base">
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/for-employers"
                  className="w-full py-4 rounded-xl border-2 border-[#1A1A1A] text-[#1A1A1A] font-bold hover:bg-[#1A1A1A]/5 transition-colors active:scale-[0.98] text-center block"
                >
                  {currentLang.pricing.btnComp}
                </Link>
              </div>

              <div className="bg-[#1A1A1A] border-2 border-[#1A1A1A] rounded-2xl p-8 md:p-10 flex flex-col text-white relative shadow-xl">
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-[#FF6A00] text-white px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Ideal Match AI
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {currentLang.pricing.comp.unlimited.name}
                </h3>
                <div className="text-4xl font-medium tracking-tight text-white mb-4">
                  {currentLang.pricing.comp.unlimited.price}
                </div>
                <p className="text-white/60 mb-8 sm:h-12">
                  {currentLang.pricing.comp.unlimited.desc}
                </p>
                <div className="flex-1 space-y-4 mb-8">
                  {currentLang.pricing.comp.unlimited.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#FF6A00] flex-shrink-0 mt-0.5" />
                      <span className="text-white/90 font-medium text-sm md:text-base">
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/for-employers"
                  className="w-full py-4 rounded-xl bg-white text-[#1A1A1A] font-bold hover:bg-[#F5F4F0] transition-colors active:scale-[0.98] text-center block"
                >
                  {currentLang.pricing.btnCompSub}
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 md:py-32 bg-[#FF6A00] text-white px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-medium tracking-tight mb-4 md:mb-8">
            {currentLang.cta.title}
          </h2>
          <p className="text-lg md:text-2xl text-white/90 mb-8 md:mb-12 font-light px-2">
            {currentLang.cta.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto bg-[#1A1A1A] text-white px-8 py-4 rounded-xl text-base md:text-lg font-bold hover:bg-black transition-colors active:scale-[0.98] text-center"
            >
              {currentLang.cta.proBtn}
            </Link>
            <Link
              href="/for-employers"
              className="w-full sm:w-auto bg-white text-[#FF6A00] px-8 py-4 rounded-xl text-base md:text-lg font-bold hover:bg-[#F5F4F0] transition-colors active:scale-[0.98] text-center"
            >
              {currentLang.cta.compBtn}
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#F5F4F0] py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <BrandMark className="w-8 h-8 text-[#FF6A00]" />
            <span className="font-bold text-xl tracking-tight text-[#1A1A1A]">
              legalops.work
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-[#1A1A1A]/60">
            <Link href="/manifesto" className="hover:text-[#FF6A00] transition-colors">
              {currentLang.footer.about}
            </Link>
            <a href="#" className="hover:text-[#FF6A00] transition-colors">
              {currentLang.footer.privacy}
            </a>
            <a href="#" className="hover:text-[#FF6A00] transition-colors">
              {currentLang.footer.contact}
            </a>
          </div>
          <div className="text-xs text-[#1A1A1A]/40 md:hidden mt-4">
            &copy; {new Date().getFullYear()} legalops.work
          </div>
        </div>
      </footer>
    </div>
  )
}
