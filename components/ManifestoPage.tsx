import Link from 'next/link'
import { ArrowRight, Globe } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'

type Locale = 'pt' | 'en'

const content = {
  pt: {
    languageHref: '/en/manifesto',
    languageLabel: 'English',
    languageCompact: 'EN',
    plansLabel: 'Planos',
    plansHref: '/pricing',
    signIn: 'Entrar',
    badge: 'Manifesto',
    title: 'Legal Ops merece mais do que um job board genérico.',
    sections: [
      {
        heading: 'O mercado está quebrado.',
        paragraphs: [
          'Se você trabalha com operações jurídicas, já sabe: encontrar a próxima oportunidade de carreira é um exercício de paciência, sorte e dezenas de abas abertas. Vagas de Legal Ops estão espalhadas entre Greenhouse, Lever, LinkedIn, Indeed e sites de empresas que ninguém indexa. Não existe um lugar só para quem constrói operações jurídicas.',
          'Do outro lado, empresas que precisam contratar esses profissionais sofrem o mesmo problema ao contrário. Publicam vagas em boards genéricos e recebem centenas de candidatos que não sabem a diferença entre um CLM e um CRM. O tempo de contratação se arrasta. O custo explode. O talento certo nunca aparece.',
        ],
      },
      {
        heading: 'Nós acreditamos em algo diferente.',
        paragraphs: [
          'Acreditamos que Legal Ops não é um cargo — é uma disciplina. Uma disciplina que está transformando como departamentos jurídicos operam no mundo inteiro. Automação de contratos, gestão de fornecedores, analytics jurídico, compliance operacional — quem faz isso não é um generalista. É um especialista que merece uma casa própria.',
          'Acreditamos que os melhores profissionais de Legal Ops não deveriam competir por atenção com milhões de vagas irrelevantes. E que as empresas que os procuram deveriam ter acesso a um pool curado, filtrado e inteligente — não a um palheiro infinito.',
        ],
      },
      {
        heading: 'Então estamos construindo a plataforma que Legal Ops merecia desde o início.',
        paragraphs: [
          'Não é só um job board. É uma rede profissional inteira desenhada para quem vive operações jurídicas.',
        ],
        bullets: [
          { bold: 'Para profissionais:', text: ' um perfil que mostra de verdade o que você faz. Vagas curadas com IA. Pipeline pessoal para acompanhar candidaturas. Interview prep. Cover letters. Tudo no mesmo lugar.' },
          { bold: 'Para empresas:', text: ' acesso ao maior pool de talentos especializados em Legal Ops. Match automático com inteligência artificial que entende a diferença entre um Legal Ops Manager e um paralegal. Candidatos pré-qualificados, não leads frios.' },
          { bold: 'Para a comunidade:', text: ' um diretório público onde profissionais se encontram, trocam experiências e constroem reputação. Um benchmark salarial transparente. Conteúdo que eleva toda a categoria.' },
        ],
      },
      {
        heading: 'A visão é simples.',
        paragraphs: [
          'Queremos que quando alguém pensar em "carreira em Legal Ops", pense em LegalOps. Quando uma empresa precisar contratar um CLM Manager, venha para cá primeiro. Quando um profissional quiser entender quanto vale no mercado, consulte nossos dados.',
          'Queremos ser a infraestrutura de carreira de uma categoria inteira. Não um produto — um ecossistema.',
        ],
      },
      {
        heading: 'E como vamos chegar lá?',
        paragraphs: [
          'Começamos do jeito mais difícil: rastreando vagas automaticamente de dezenas de fontes, enriquecendo cada uma com IA para extrair salários, benefícios, modelo de trabalho e até quem seria seu futuro gestor. Fizemos isso porque ninguém mais faz — e porque acreditamos que informação é poder.',
          'Agora estamos abrindo a plataforma para profissionais criarem seus perfis, para empresas publicarem vagas e para que o match aconteça de forma natural. Não forçamos conexões — criamos o ambiente para que as certas aconteçam.',
          'Somos gratuitos para começar. Sempre seremos. Porque a base da rede é o profissional, e o profissional precisa estar aqui antes de tudo. Quem quer ir mais rápido, paga. Quem quer contratar os melhores, paga. Quem só quer participar da comunidade, é bem-vindo.',
        ],
      },
      {
        heading: 'Isso é um convite.',
        paragraphs: [
          'Se você é profissional de Legal Ops, este é o seu lugar. Crie seu perfil. Mostre ao mercado o que você constrói. Use as ferramentas para encontrar sua próxima oportunidade. Faça parte de uma comunidade que entende o que você faz — porque faz a mesma coisa.',
          'Se você contrata profissionais de Legal Ops, pare de procurar no lugar errado. Os melhores estão aqui. E nosso algoritmo sabe encontrá-los para você.',
        ],
        closing: 'Legal Ops é o futuro das operações jurídicas.\nE o futuro precisa de uma casa.',
      },
    ],
    primaryCta: 'Criar minha conta grátis',
    secondaryCta: 'Sou empresa — quero contratar',
    secondaryHref: '/for-employers',
    signature: '— O time LegalOps',
    date: 'Março de 2026',
  },
  en: {
    languageHref: '/manifesto',
    languageLabel: 'Português',
    languageCompact: 'PT',
    plansLabel: 'Plans',
    plansHref: '/en/pricing',
    signIn: 'Sign in',
    badge: 'Manifesto',
    title: 'Legal Ops deserves more than a generic job board.',
    sections: [
      {
        heading: 'The market is broken.',
        paragraphs: [
          'If you work in legal operations, you already know: finding your next career opportunity is an exercise in patience, luck, and dozens of open tabs. Legal Ops roles are scattered across Greenhouse, Lever, LinkedIn, Indeed, and company sites nobody indexes. There is no single place for those who build legal operations.',
          'On the other side, companies that need to hire these professionals face the same problem in reverse. They post on generic boards and receive hundreds of applicants who don\'t know the difference between a CLM and a CRM. Time-to-hire drags on. Costs explode. The right talent never shows up.',
        ],
      },
      {
        heading: 'We believe in something different.',
        paragraphs: [
          'We believe Legal Ops is not a job title — it\'s a discipline. A discipline that is transforming how legal departments operate worldwide. Contract automation, vendor management, legal analytics, operational compliance — those who do this are not generalists. They are specialists who deserve a home of their own.',
          'We believe the best Legal Ops professionals shouldn\'t have to compete for attention with millions of irrelevant listings. And that the companies looking for them should have access to a curated, filtered, intelligent pool — not an infinite haystack.',
        ],
      },
      {
        heading: 'So we\'re building the platform Legal Ops deserved from day one.',
        paragraphs: [
          'It\'s not just a job board. It\'s an entire professional network designed for those who live legal operations.',
        ],
        bullets: [
          { bold: 'For professionals:', text: ' a profile that truly shows what you do. AI-curated jobs. A personal pipeline to track applications. Interview prep. Cover letters. All in one place.' },
          { bold: 'For employers:', text: ' access to the largest pool of specialized Legal Ops talent. AI-powered matching that understands the difference between a Legal Ops Manager and a paralegal. Pre-qualified candidates, not cold leads.' },
          { bold: 'For the community:', text: ' a public directory where professionals meet, share experiences, and build reputation. A transparent salary benchmark. Content that elevates the entire category.' },
        ],
      },
      {
        heading: 'The vision is simple.',
        paragraphs: [
          'We want "Legal Ops career" to mean LegalOps. When a company needs to hire a CLM Manager, they come here first. When a professional wants to understand their market value, they check our data.',
          'We want to be the career infrastructure for an entire category. Not a product — an ecosystem.',
        ],
      },
      {
        heading: 'How will we get there?',
        paragraphs: [
          'We started the hard way: automatically tracking jobs from dozens of sources, enriching each one with AI to extract salaries, benefits, work model, and even who your future manager would be. We did this because no one else does — and because we believe information is power.',
          'Now we\'re opening the platform for professionals to create their profiles, for companies to post jobs, and for matching to happen naturally. We don\'t force connections — we create the environment for the right ones to happen.',
          'We\'re free to start. We always will be. Because the foundation of the network is the professional, and the professional needs to be here before anything else. Those who want to move faster, pay. Those who want to hire the best, pay. Those who just want to be part of the community are welcome.',
        ],
      },
      {
        heading: 'This is an invitation.',
        paragraphs: [
          'If you\'re a Legal Ops professional, this is your place. Create your profile. Show the market what you build. Use the tools to find your next opportunity. Be part of a community that understands what you do — because they do the same thing.',
          'If you hire Legal Ops professionals, stop looking in the wrong place. The best ones are here. And our algorithm knows how to find them for you.',
        ],
        closing: 'Legal Ops is the future of legal operations.\nAnd the future needs a home.',
      },
    ],
    primaryCta: 'Create my free account',
    secondaryCta: 'I\'m an employer — I want to hire',
    secondaryHref: '/en/for-employers',
    signature: '— The LegalOps team',
    date: 'March 2026',
  },
} as const

export function ManifestoPage({ locale }: { locale: Locale }) {
  const copy = content[locale]

  return (
    <div lang={locale === 'pt' ? 'pt-BR' : 'en'} className="min-h-screen bg-stone-50 text-slate-950">
      {/* Header */}
      <header className="border-b border-stone-200 bg-stone-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href={locale === 'pt' ? '/' : '/en'}>
            <BrandLogo
              className="flex items-center gap-3"
              markClassName="h-10 w-10 text-slate-950"
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={copy.plansHref}
              className="hidden sm:inline-flex rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-950"
            >
              {copy.plansLabel}
            </Link>
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
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              {copy.signIn}
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <article className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          {copy.badge}
        </p>

        <h1
          className="mt-4 text-4xl leading-tight sm:text-5xl"
          style={{
            fontFamily:
              '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
          }}
        >
          {copy.title}
        </h1>

        <div className="mt-10 space-y-8 text-base leading-8 text-slate-700">
          {copy.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-semibold text-slate-950">
                {section.heading}
              </h2>
              {section.paragraphs.map((p, i) => (
                <p key={i} className="mt-3">
                  {p}
                </p>
              ))}
              {'bullets' in section && section.bullets && (
                <ul className="mt-4 space-y-3">
                  {section.bullets.map((bullet) => (
                    <li key={bullet.bold} className="flex gap-3">
                      <span className="mt-1 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-950" />
                      <span>
                        <strong className="text-slate-950">{bullet.bold}</strong>
                        {bullet.text}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {'closing' in section && section.closing && (
                <p className="mt-3 font-medium text-slate-950">
                  {section.closing.split('\n').map((line, i) => (
                    <span key={i}>
                      {i > 0 && <br />}
                      {line}
                    </span>
                  ))}
                </p>
              )}
            </section>
          ))}
        </div>

        {/* CTAs */}
        <div className="mt-12 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            {copy.primaryCta}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={copy.secondaryHref}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 px-6 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-950"
          >
            {copy.secondaryCta}
          </Link>
        </div>

        {/* Signature */}
        <div className="mt-16 border-t border-stone-200 pt-8">
          <p className="text-sm text-slate-500">
            {copy.signature}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {copy.date}
          </p>
        </div>
      </article>
    </div>
  )
}
