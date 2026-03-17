'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

export type Locale = 'pt' | 'en'

const STORAGE_KEY = 'legalops-locale'

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'pt'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'en' || stored === 'pt') return stored
  return navigator.language.startsWith('en') ? 'en' : 'pt'
}

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translations
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('pt')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setLocaleState(getInitialLocale())
    setMounted(true)
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem(STORAGE_KEY, newLocale)
    document.documentElement.lang = newLocale === 'pt' ? 'pt-BR' : 'en'
  }, [])

  const t = translations[locale]

  if (!mounted) {
    return <I18nContext.Provider value={{ locale: 'pt', setLocale, t: translations.pt }}>{children}</I18nContext.Provider>
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within LocaleProvider')
  return ctx
}

// ─── Translations ────────────────────────────────────────────────────────────

export interface Translations {
  // Nav
  nav: {
    dashboard: string
    discover: string
    pipeline: string
    professionals: string
    emails: string
    settings: string
    signOut: string
    home: string
    switchLang: string
    switchLangCompact: string
  }

  // Dashboard
  dashboard: {
    title: string
    subtitle: string
    discoverJobs: string
    totalTracked: string
    appliedThisWeek: string
    interviewsThisWeek: string
    responseRate: string
    responseRateSub: string
    pipelineFunnel: string
    recentActivity: string
    viewPipeline: string
    noActivityYet: string
    tipsTitle: string
    tip1Title: string
    tip1Text: string
    tip2Title: string
    tip2Text: string
    tip3Title: string
    tip3Text: string
  }

  // Statuses
  status: {
    researching: string
    applied: string
    interview: string
    offer: string
    discarded: string
  }

  // Job Card
  jobCard: {
    add: string
    ignore: string
    undisclosed: string
    possiblyClosed: string
    today: string
    yesterday: string
    daysAgo: (n: number) => string
  }

  // Discover
  discover: {
    crawlerMonitor: string
    lastRun: (date: string, source: string) => string
    noRunsYet: string
    newJobs: string
    duplicates: string
    scraped: string
    last7Days: string
    searchPlaceholder: string
    jobCount: (n: number) => string
    filters: string
    all: string
    fullyRemote: string
    remoteTravel: string
    hybrid: string
    onsite: string
    anySalary: string
    disclosedSalary: string
    highSalary: string
    newest: string
    highestSalary: string
    noJobsFound: string
    noJobsHint: string
    noJobsFilterHint: string
    loadMore: string
    loading: string
  }

  // Kanban
  kanban: {
    noJobsYet: string
  }

  // Login
  login: {
    subtitle: string
    email: string
    password: string
    emailPlaceholder: string
    signIn: string
    signUp: string
    loadingText: string
    noAccount: string
    hasAccount: string
    featureDiscovery: string
    featureDiscoverySub: string
    featureAI: string
    featureAISub: string
    featurePipeline: string
    featurePipelineSub: string
  }

  // Job Detail
  jobDetail: {
    backToPipeline: string
    backToHome: string
    addedOn: (date: string) => string
    apply: string
    salary: string
    contacts: string
    events: string
    overviewTab: string
    aiToolsTab: string
    networkingTab: string
    modality: string
    publishedAs: string
    benefits: string
    noBenefits: string
    directManager: string
    applicationEmail: string
    aliasHint: string
    aliasPending: string
    copied: string
    copyAlias: string
    notes: string
    timeline: string
    specialistAgents: string
    interviewPrep: string
    coverLetter: string
  }

  // Professionals
  professionals: {
    title: string
    subtitle: string
    searchPlaceholder: string
    noResults: string
    noResultsSearch: string
    yearsExp: (n: number) => string
    viewLinkedIn: string
    professional: string
  }

  // Email
  emailPage: {
    title: string
    subtitle: string
    planRules: string
    currentTier: string
    activeAliases: string
    randomAliases: string
    customAliases: string
    enabled: string
    unavailable: string
    paidOnly: string
    createAlias: string
    remainingSlots: (n: number) => string
    createRandom: string
    creatingRandom: string
    createCustom: string
    creatingCustom: string
    freeUserNote: string
    provisionedAliases: string
    noAliases: string
    makePrimary: string
    disable: string
    reactivate: string
    saving: string
    recentMailbox: string
    noMessages: string
  }

  // Remote badge
  remote: {
    fullyRemote: string
    remoteTravel: string
    hybrid: string
    onsite: string
    unknown: string
  }

  // Onboard
  onboard: {
    setupSubtitle: string
    basicsTitle: string
    basicsSubtitle: string
    fullName: string
    fullNamePlaceholder: string
    currentRole: string
    currentRolePlaceholder: string
    currentRoleHint: string
    continue: string
    saving: string
    back: string
    professionalTitle: string
    professionalSubtitle: string
    yearsExperience: string
    expertiseTitle: string
    expertiseSubtitle: string
    areasSelected: (n: number) => string
    linkedinTitle: string
    linkedinSubtitle: string
    linkedinBenefits: string[]
    linkedinUrlLabel: string
    linkedinUrlPlaceholder: string
    linkedinUrlHint: string
    analyzeLinkedin: string
    analyzingLinkedin: string
    skipLinkedin: string
    insightsTitle: string
    insightsSubtitleScraped: string
    insightsSubtitleGenerated: string
    noInsights: string
    goToPlatform: string
    finishing: string
    insightsSaved: string
    stepBasics: string
    stepProfessional: string
    stepExpertise: string
    stepLinkedin: string
    stepInsights: string
    // Professional types
    lawFirm: string
    lawFirmDesc: string
    legalDept: string
    legalDeptDesc: string
    publicSector: string
    publicSectorDesc: string
    freelance: string
    freelanceDesc: string
    other: string
    otherDesc: string
    // Priority labels
    highPriority: string
    mediumPriority: string
    lowPriority: string
    action: string
    validNameError: string
    selectTypeError: string
    validLinkedinError: string
    unknownError: string
  }
}

const pt: Translations = {
  nav: {
    dashboard: 'Dashboard',
    discover: 'Descobrir',
    pipeline: 'Pipeline',
    professionals: 'Profissionais',
    emails: 'Emails',
    settings: 'Configuracoes',
    signOut: 'Sair',
    home: 'Inicio',
    switchLang: 'English',
    switchLangCompact: 'EN',
  },
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Sua visao geral da busca de emprego',
    discoverJobs: 'Descobrir vagas',
    totalTracked: 'Total rastreadas',
    appliedThisWeek: 'Aplicadas esta semana',
    interviewsThisWeek: 'Entrevistas esta semana',
    responseRate: 'Taxa de resposta',
    responseRateSub: 'Entrevistas + Ofertas / Total ativo',
    pipelineFunnel: 'Funil do Pipeline',
    recentActivity: 'Atividade recente',
    viewPipeline: 'Ver pipeline',
    noActivityYet: 'Nenhuma atividade ainda. Comece adicionando vagas!',
    tipsTitle: 'Dicas para sua busca',
    tip1Title: 'Mantenha o ritmo',
    tip1Text: 'Tente aplicar para pelo menos 5 vagas por semana para manter um fluxo constante.',
    tip2Title: 'Follow-up importa',
    tip2Text: 'Acompanhe suas aplicacoes 5-7 dias apos o envio. Use as notas para registrar cada interacao.',
    tip3Title: 'Prepare-se com IA',
    tip3Text: 'Use nosso prep de entrevista com IA para se preparar antes de cada conversa.',
  },
  status: {
    researching: 'Pesquisando',
    applied: 'Aplicada',
    interview: 'Entrevista',
    offer: 'Oferta',
    discarded: 'Descartada',
  },
  jobCard: {
    add: 'Adicionar',
    ignore: 'Ignorar',
    undisclosed: 'Nao divulgado',
    possiblyClosed: 'Possivelmente encerrada',
    today: 'hoje',
    yesterday: 'ontem',
    daysAgo: (n) => `ha ${n} dias`,
  },
  discover: {
    crawlerMonitor: 'Crawler monitor',
    lastRun: (date, source) => `Ultima execucao em ${date} usando ${source}.`,
    noRunsYet: 'Ainda nao ha execucoes registradas do crawler.',
    newJobs: 'Novas',
    duplicates: 'Duplicadas',
    scraped: 'Varridas',
    last7Days: 'Ultimos 7 dias',
    searchPlaceholder: 'Buscar por cargo ou empresa...',
    jobCount: (n) => `${n} vaga${n !== 1 ? 's' : ''}`,
    filters: 'Filtros:',
    all: 'Todos',
    fullyRemote: '100% Remoto',
    remoteTravel: 'Remoto + Viagem',
    hybrid: 'Hibrido',
    onsite: 'Presencial',
    anySalary: 'Qualquer salario',
    disclosedSalary: 'Salario divulgado',
    highSalary: 'Alto (100k+)',
    newest: 'Mais recentes',
    highestSalary: 'Maior salario',
    noJobsFound: 'Nenhuma vaga encontrada',
    noJobsHint: 'A proxima busca roda amanha as 7h.',
    noJobsFilterHint: 'Tente ajustar seus filtros de busca.',
    loadMore: 'Carregar mais',
    loading: 'Carregando...',
  },
  kanban: {
    noJobsYet: 'Nenhuma vaga aqui ainda',
  },
  login: {
    subtitle: 'Plataforma inteligente de job hunting para Legal Operations',
    email: 'Email',
    password: 'Senha',
    emailPlaceholder: 'seu@email.com',
    signIn: 'Entrar',
    signUp: 'Criar conta',
    loadingText: 'Carregando...',
    noAccount: 'Nao tem conta? Cadastre-se',
    hasAccount: 'Ja tem conta? Entre',
    featureDiscovery: 'Descoberta',
    featureDiscoverySub: 'Vagas automaticas',
    featureAI: 'IA',
    featureAISub: 'Prep & Cover',
    featurePipeline: 'Pipeline',
    featurePipelineSub: 'Kanban visual',
  },
  jobDetail: {
    backToPipeline: 'Voltar ao pipeline',
    backToHome: 'Voltar ao inicio',
    addedOn: (date) => `Adicionada em ${date}`,
    apply: 'Aplicar',
    salary: 'Salario',
    contacts: 'Contatos',
    events: 'Eventos',
    overviewTab: 'Visao geral',
    aiToolsTab: 'Ferramentas IA',
    networkingTab: 'Networking',
    modality: 'Modalidade',
    publishedAs: 'Publicado como:',
    benefits: 'Beneficios',
    noBenefits: 'Nao divulgados',
    directManager: 'Gestor direto',
    applicationEmail: 'Email da candidatura',
    aliasHint: 'Use este alias em formularios e replies desta vaga. O historico chega na aba Emails.',
    aliasPending: 'O alias sera atribuido automaticamente quando a vaga for marcada como aplicada.',
    copied: 'Copiado',
    copyAlias: 'Copiar alias',
    notes: 'Notas',
    timeline: 'Linha do tempo',
    specialistAgents: 'Agentes especialistas',
    interviewPrep: 'Preparacao para entrevista',
    coverLetter: 'Cover letter rapida',
  },
  professionals: {
    title: 'Diretorio de Profissionais',
    subtitle: 'Conecte-se com profissionais de Legal Ops do mundo todo.',
    searchPlaceholder: 'Buscar por nome, cargo, skill ou ferramenta...',
    noResults: 'Nenhum profissional cadastrado ainda.',
    noResultsSearch: 'Nenhum profissional encontrado com esses criterios.',
    yearsExp: (n) => `${n}+ anos`,
    viewLinkedIn: 'Ver LinkedIn',
    professional: 'Profissional',
  },
  emailPage: {
    title: 'Email aliases',
    subtitle: 'Gerencie os aliases de candidatura e acompanhe aqui as respostas recebidas em cada vaga aplicada.',
    planRules: 'Regras do plano',
    currentTier: 'Tier atual',
    activeAliases: 'Aliases ativos',
    randomAliases: 'Aliases aleatorios',
    customAliases: 'Aliases personalizados',
    enabled: 'Habilitado',
    unavailable: 'Indisponivel',
    paidOnly: 'Somente plano pago',
    createAlias: 'Criar alias',
    remainingSlots: (n) => `Slots ativos restantes: ${n}`,
    createRandom: 'Criar alias aleatorio',
    creatingRandom: 'Criando alias aleatorio...',
    createCustom: 'Criar alias personalizado',
    creatingCustom: 'Criando alias personalizado...',
    freeUserNote: 'Usuarios gratuitos podem criar um alias aleatorio. Usuarios pagos podem criar aliases personalizados.',
    provisionedAliases: 'Aliases provisionados',
    noAliases: 'Nenhum alias provisionado ainda. Crie um para comecar a receber respostas.',
    makePrimary: 'Tornar principal',
    disable: 'Desativar',
    reactivate: 'Reativar',
    saving: 'Salvando...',
    recentMailbox: 'Atividade recente da caixa',
    noMessages: 'Nenhuma mensagem recebida ou enviada ainda.',
  },
  remote: {
    fullyRemote: '100% Remoto',
    remoteTravel: 'Remoto + Viagem',
    hybrid: 'Hibrido (verificar)',
    onsite: 'Presencial',
    unknown: 'Remoto?',
  },
  onboard: {
    setupSubtitle: 'Vamos configurar seu perfil profissional',
    basicsTitle: 'Dados basicos',
    basicsSubtitle: 'Como devemos te chamar e qual e seu cargo atual?',
    fullName: 'Nome completo',
    fullNamePlaceholder: 'Ex: Maria Clara Souza',
    currentRole: 'Cargo atual',
    currentRolePlaceholder: 'Ex: Legal Operations Specialist, Advogada Senior...',
    currentRoleHint: 'Se estiver em transicao, informe o cargo que deseja ou o mais recente.',
    continue: 'Continuar',
    saving: 'Salvando...',
    back: 'Voltar',
    professionalTitle: 'Tipo de atuacao',
    professionalSubtitle: 'Onde voce atua ou quer atuar profissionalmente?',
    yearsExperience: 'Anos de experiencia juridica',
    expertiseTitle: 'Areas de especializacao',
    expertiseSubtitle: 'Selecione as areas em que voce atua ou tem interesse. Isso melhora as sugestoes de vagas.',
    areasSelected: (n) => `${n} area${n > 1 ? 's' : ''} selecionada${n > 1 ? 's' : ''}`,
    linkedinTitle: 'Perfil LinkedIn',
    linkedinSubtitle: 'Informe o link do seu LinkedIn. Vamos analisar seu perfil e sugerir quick wins para voce conquistar mais vagas na area juridica.',
    linkedinBenefits: [
      'Analise do headline e visibilidade nos recrutadores',
      'Gaps de keywords relevantes para Legal Ops',
      'Sugestoes de secoes em falta (Sobre, Skills, etc.)',
      'Dicas para aumentar o alcance organico do perfil',
    ],
    linkedinUrlLabel: 'URL do LinkedIn',
    linkedinUrlPlaceholder: 'https://linkedin.com/in/seuperfil',
    linkedinUrlHint: 'Certifique-se de que seu perfil esta publico para melhor analise.',
    analyzeLinkedin: 'Analisar meu LinkedIn',
    analyzingLinkedin: 'Analisando perfil...',
    skipLinkedin: 'Pular por agora — adicionar depois nas configuracoes',
    insightsTitle: 'Seus quick wins do LinkedIn',
    insightsSubtitleScraped: 'Analisamos seu perfil e identificamos as principais oportunidades de melhoria.',
    insightsSubtitleGenerated: 'Geramos recomendacoes baseadas no seu contexto profissional para impulsionar seu perfil.',
    noInsights: 'Nao foi possivel gerar insights agora. Voce pode tentar novamente nas configuracoes.',
    goToPlatform: 'Ir para a plataforma',
    finishing: 'Finalizando...',
    insightsSaved: 'Esses insights ficam salvos nas suas configuracoes de perfil.',
    stepBasics: 'Dados basicos',
    stepProfessional: 'Tipo de atuacao',
    stepExpertise: 'Especialidades',
    stepLinkedin: 'LinkedIn',
    stepInsights: 'Quick wins',
    lawFirm: 'Escritorio de advocacia',
    lawFirmDesc: 'Atuo ou quero atuar em escritorio de advocacia (societario, consultivo ou contencioso)',
    legalDept: 'Departamento juridico (in-house)',
    legalDeptDesc: 'Atuo ou quero atuar no juridico de uma empresa (in-house counsel / Legal Ops)',
    publicSector: 'Cargo publico / concurso',
    publicSectorDesc: 'Busco ou ja ocupo cargo em orgao publico, autarquia, tribunal ou MP',
    freelance: 'Freelance / autonomo(a)',
    freelanceDesc: 'Trabalho de forma independente prestando servicos juridicos',
    other: 'Outro',
    otherDesc: 'LegalTech, consultoria, academia ou outra area do setor juridico',
    highPriority: 'Alta prioridade',
    mediumPriority: 'Media prioridade',
    lowPriority: 'Baixa prioridade',
    action: 'Acao:',
    validNameError: 'Por favor, informe seu nome completo.',
    selectTypeError: 'Selecione seu tipo de atuacao.',
    validLinkedinError: 'Informe uma URL valida do LinkedIn (ex: https://linkedin.com/in/seuperfil)',
    unknownError: 'Erro desconhecido',
  },
}

const en: Translations = {
  nav: {
    dashboard: 'Dashboard',
    discover: 'Discover',
    pipeline: 'Pipeline',
    professionals: 'Professionals',
    emails: 'Emails',
    settings: 'Settings',
    signOut: 'Sign out',
    home: 'Home',
    switchLang: 'Portugues',
    switchLangCompact: 'PT',
  },
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Your job search overview',
    discoverJobs: 'Discover jobs',
    totalTracked: 'Total tracked',
    appliedThisWeek: 'Applied this week',
    interviewsThisWeek: 'Interviews this week',
    responseRate: 'Response rate',
    responseRateSub: 'Interviews + Offers / Total active',
    pipelineFunnel: 'Pipeline Funnel',
    recentActivity: 'Recent activity',
    viewPipeline: 'View pipeline',
    noActivityYet: 'No activity yet. Start by adding jobs!',
    tipsTitle: 'Job search tips',
    tip1Title: 'Keep the pace',
    tip1Text: 'Try to apply to at least 5 jobs per week to maintain a steady flow.',
    tip2Title: 'Follow-up matters',
    tip2Text: 'Follow up on your applications 5-7 days after submission. Use notes to track each interaction.',
    tip3Title: 'Prepare with AI',
    tip3Text: 'Use our AI interview prep to get ready before each conversation.',
  },
  status: {
    researching: 'Researching',
    applied: 'Applied',
    interview: 'Interview',
    offer: 'Offer',
    discarded: 'Discarded',
  },
  jobCard: {
    add: 'Add',
    ignore: 'Ignore',
    undisclosed: 'Undisclosed',
    possiblyClosed: 'Possibly closed',
    today: 'today',
    yesterday: 'yesterday',
    daysAgo: (n) => `${n} days ago`,
  },
  discover: {
    crawlerMonitor: 'Crawler monitor',
    lastRun: (date, source) => `Last run on ${date} using ${source}.`,
    noRunsYet: 'No crawler runs recorded yet.',
    newJobs: 'New',
    duplicates: 'Duplicates',
    scraped: 'Scraped',
    last7Days: 'Last 7 days',
    searchPlaceholder: 'Search by role or company...',
    jobCount: (n) => `${n} job${n !== 1 ? 's' : ''}`,
    filters: 'Filters:',
    all: 'All',
    fullyRemote: 'Fully Remote',
    remoteTravel: 'Remote + Travel',
    hybrid: 'Hybrid',
    onsite: 'On-site',
    anySalary: 'Any salary',
    disclosedSalary: 'Disclosed salary',
    highSalary: 'High (100k+)',
    newest: 'Newest',
    highestSalary: 'Highest salary',
    noJobsFound: 'No jobs found',
    noJobsHint: 'The next crawl runs tomorrow at 7am.',
    noJobsFilterHint: 'Try adjusting your search filters.',
    loadMore: 'Load more',
    loading: 'Loading...',
  },
  kanban: {
    noJobsYet: 'No jobs here yet',
  },
  login: {
    subtitle: 'Smart job hunting platform for Legal Operations',
    email: 'Email',
    password: 'Password',
    emailPlaceholder: 'you@email.com',
    signIn: 'Sign in',
    signUp: 'Create account',
    loadingText: 'Loading...',
    noAccount: "Don't have an account? Sign up",
    hasAccount: 'Already have an account? Sign in',
    featureDiscovery: 'Discovery',
    featureDiscoverySub: 'Auto jobs',
    featureAI: 'AI',
    featureAISub: 'Prep & Cover',
    featurePipeline: 'Pipeline',
    featurePipelineSub: 'Visual Kanban',
  },
  jobDetail: {
    backToPipeline: 'Back to pipeline',
    backToHome: 'Back to home',
    addedOn: (date) => `Added on ${date}`,
    apply: 'Apply',
    salary: 'Salary',
    contacts: 'Contacts',
    events: 'Events',
    overviewTab: 'Overview',
    aiToolsTab: 'AI Tools',
    networkingTab: 'Networking',
    modality: 'Work model',
    publishedAs: 'Published as:',
    benefits: 'Benefits',
    noBenefits: 'Not disclosed',
    directManager: 'Direct manager',
    applicationEmail: 'Application email',
    aliasHint: 'Use this alias in forms and replies for this job. History appears in the Emails tab.',
    aliasPending: 'The alias will be assigned automatically when the job is marked as applied.',
    copied: 'Copied',
    copyAlias: 'Copy alias',
    notes: 'Notes',
    timeline: 'Timeline',
    specialistAgents: 'Specialist agents',
    interviewPrep: 'Interview preparation',
    coverLetter: 'Quick cover letter',
  },
  professionals: {
    title: 'Professionals Directory',
    subtitle: 'Connect with Legal Ops professionals worldwide.',
    searchPlaceholder: 'Search by name, role, skill or tool...',
    noResults: 'No professionals registered yet.',
    noResultsSearch: 'No professionals found matching those criteria.',
    yearsExp: (n) => `${n}+ years`,
    viewLinkedIn: 'View LinkedIn',
    professional: 'Professional',
  },
  emailPage: {
    title: 'Email aliases',
    subtitle: 'Manage your application aliases and track replies received for each applied job.',
    planRules: 'Plan rules',
    currentTier: 'Current tier',
    activeAliases: 'Active aliases',
    randomAliases: 'Random aliases',
    customAliases: 'Custom aliases',
    enabled: 'Enabled',
    unavailable: 'Unavailable',
    paidOnly: 'Paid only',
    createAlias: 'Create alias',
    remainingSlots: (n) => `Remaining active slots: ${n}`,
    createRandom: 'Create random alias',
    creatingRandom: 'Creating random alias...',
    createCustom: 'Create custom alias',
    creatingCustom: 'Creating custom alias...',
    freeUserNote: 'Free users can provision a single random alias. Paid users can create branded custom aliases.',
    provisionedAliases: 'Provisioned aliases',
    noAliases: 'No aliases provisioned yet. Create one to start routing replies into your inbox.',
    makePrimary: 'Make primary',
    disable: 'Disable',
    reactivate: 'Reactivate',
    saving: 'Saving...',
    recentMailbox: 'Recent mailbox activity',
    noMessages: 'No inbound or outbound messages yet.',
  },
  remote: {
    fullyRemote: '100% Remote',
    remoteTravel: 'Remote + Travel',
    hybrid: 'Hybrid (verify)',
    onsite: 'On-site',
    unknown: 'Remote?',
  },
  onboard: {
    setupSubtitle: "Let's set up your professional profile",
    basicsTitle: 'Basic info',
    basicsSubtitle: 'What should we call you and what is your current role?',
    fullName: 'Full name',
    fullNamePlaceholder: 'E.g.: Maria Clara Souza',
    currentRole: 'Current role',
    currentRolePlaceholder: 'E.g.: Legal Operations Specialist, Senior Attorney...',
    currentRoleHint: 'If transitioning, enter your desired or most recent role.',
    continue: 'Continue',
    saving: 'Saving...',
    back: 'Back',
    professionalTitle: 'Professional type',
    professionalSubtitle: 'Where do you work or want to work professionally?',
    yearsExperience: 'Years of legal experience',
    expertiseTitle: 'Areas of expertise',
    expertiseSubtitle: 'Select the areas you work in or are interested in. This improves job suggestions.',
    areasSelected: (n) => `${n} area${n > 1 ? 's' : ''} selected`,
    linkedinTitle: 'LinkedIn Profile',
    linkedinSubtitle: 'Enter your LinkedIn URL. We will analyze your profile and suggest quick wins to help you land more legal jobs.',
    linkedinBenefits: [
      'Headline analysis and recruiter visibility',
      'Relevant keyword gaps for Legal Ops',
      'Suggestions for missing sections (About, Skills, etc.)',
      'Tips to increase organic profile reach',
    ],
    linkedinUrlLabel: 'LinkedIn URL',
    linkedinUrlPlaceholder: 'https://linkedin.com/in/yourprofile',
    linkedinUrlHint: 'Make sure your profile is public for the best analysis.',
    analyzeLinkedin: 'Analyze my LinkedIn',
    analyzingLinkedin: 'Analyzing profile...',
    skipLinkedin: 'Skip for now — add later in settings',
    insightsTitle: 'Your LinkedIn quick wins',
    insightsSubtitleScraped: 'We analyzed your profile and identified the main improvement opportunities.',
    insightsSubtitleGenerated: 'We generated recommendations based on your professional context to boost your profile.',
    noInsights: 'Could not generate insights now. You can try again in settings.',
    goToPlatform: 'Go to the platform',
    finishing: 'Finishing...',
    insightsSaved: 'These insights are saved in your profile settings.',
    stepBasics: 'Basic info',
    stepProfessional: 'Professional type',
    stepExpertise: 'Expertise',
    stepLinkedin: 'LinkedIn',
    stepInsights: 'Quick wins',
    lawFirm: 'Law firm',
    lawFirmDesc: 'I work or want to work at a law firm (corporate, advisory or litigation)',
    legalDept: 'Legal department (in-house)',
    legalDeptDesc: 'I work or want to work in a company legal team (in-house counsel / Legal Ops)',
    publicSector: 'Public sector',
    publicSectorDesc: 'I seek or hold a position in a public agency, court or prosecution office',
    freelance: 'Freelance / independent',
    freelanceDesc: 'I work independently providing legal services',
    other: 'Other',
    otherDesc: 'LegalTech, consulting, academia or another area of the legal sector',
    highPriority: 'High priority',
    mediumPriority: 'Medium priority',
    lowPriority: 'Low priority',
    action: 'Action:',
    validNameError: 'Please enter your full name.',
    selectTypeError: 'Select your professional type.',
    validLinkedinError: 'Enter a valid LinkedIn URL (e.g.: https://linkedin.com/in/yourprofile)',
    unknownError: 'Unknown error',
  },
}

export const translations = { pt, en } as const
