import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Lock } from 'lucide-react'
import { BrandMark } from '@/components/BrandLogo'
import { CLUB_LAUNCH_TIERS, formatBRL } from '@/lib/club-pricing'
import { COMMUNITY_CATEGORIES, getInitials } from '@/lib/community'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const metadata: Metadata = {
  title: 'LegalOps Club | Comunidade de operações jurídicas',
  description:
    'Uma comunidade para profissionais trocarem experiências sobre processos, tecnologia, dados, contratos e gestão jurídica.',
}

type PublicPost = {
  id: string
  author_name: string
  author_role: string | null
  category: string
  title: string
  body: string
}

const publicPostFallback: PublicPost[] = [
  {
    id: 'welcome',
    author_name: 'Equipe LegalOps',
    author_role: 'Curadoria',
    category: 'ia-automacao',
    title: 'IA jurídica: do piloto isolado à operação que escala',
    body: 'Comece pelo fluxo, defina o risco aceitável e escolha uma métrica de qualidade antes da ferramenta.',
  },
  {
    id: 'metrics',
    author_name: 'Equipe LegalOps',
    author_role: 'Curadoria',
    category: 'dados-metricas',
    title: 'Métricas que mudam decisões',
    body: 'Combine demanda, tempo de ciclo, capacidade, risco e resultado para enxergar onde agir.',
  },
]

const topicKeys = [
  'ia-automacao',
  'dados-metricas',
  'contratos-clm',
  'processos-projetos',
  'ferramentas',
  'financeiro-fornecedores',
  'governanca-conhecimento',
  'estrategia-maturidade',
  'modelos-entrega',
  'carreira',
]

const membershipIncludes = [
  {
    title: 'Discussões entre pares',
    description: 'Perguntas com contexto e respostas de quem conhece as restrições da operação jurídica.',
  },
  {
    title: 'Encontros ao vivo',
    description: 'Uma conversa ganha mais tempo quando o assunto pede demonstração, contraponto ou detalhe.',
  },
  {
    title: 'Síntese da semana',
    description: 'A IA organiza os argumentos e indica as fontes. A leitura e as conclusões continuam humanas.',
  },
  {
    title: 'Perfis verificados',
    description: 'Você sabe com quem está falando e pode encontrar profissionais com experiência próxima à sua.',
  },
]

const checkoutEnvironmentKeys: Record<string, string | undefined> = {
  founder_199: process.env.CLUB_CHECKOUT_FOUNDER_199_URL,
  founder_299: process.env.CLUB_CHECKOUT_FOUNDER_299_URL,
  pioneer_499: process.env.CLUB_CHECKOUT_PIONEER_499_URL,
  launch_699: process.env.CLUB_CHECKOUT_LAUNCH_699_URL,
}

export const dynamic = 'force-dynamic'

export default async function ClubLandingPage() {
  const supabase = await createServerSupabaseClient()
  const { data: rawPublicPosts } = await supabase
    .from('community_posts')
    .select('id, author_name, author_role, category, title, body')
    .eq('visibility', 'public')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(6)

  const publicPosts = rawPublicPosts && rawPublicPosts.length >= 2
    ? rawPublicPosts as PublicPost[]
    : publicPostFallback

  const firstTier = CLUB_LAUNCH_TIERS[0]
  const firstTierCheckout = checkoutEnvironmentKeys[firstTier.id] ?? '/login?next=/community'

  return (
    <div className="min-h-screen bg-[#F4F0E7] text-[#203027]">
      <header className="sticky top-0 z-30 border-b border-[#203027]/25 bg-[#F4F0E7]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-5 sm:px-8">
          <Link href="/club" className="flex items-center gap-3" aria-label="LegalOps Club">
            <BrandMark className="h-8 w-8 text-[#203027]" />
            <span className="text-[13px] font-bold tracking-[0.08em]">
              LEGALOPS <span className="text-[#B9472A]">CLUB</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-[13px] text-[#203027]/65 md:flex">
            <a href="#conversas" className="transition hover:text-[#203027]">Conversas</a>
            <a href="#formato" className="transition hover:text-[#203027]">Como funciona</a>
            <a href="#assuntos" className="transition hover:text-[#203027]">Assuntos</a>
            <a href="#valor" className="transition hover:text-[#203027]">Valor</a>
          </nav>

          <Link
            href="/login?next=/community"
            className="text-[13px] font-semibold underline decoration-[#203027]/30 underline-offset-4 hover:decoration-[#203027]"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main>
        <section className="border-b border-[#203027]/25">
          <div className="mx-auto grid max-w-[1120px] lg:grid-cols-[1.18fr_0.82fr]">
            <div className="px-5 py-16 sm:px-8 sm:py-24 lg:border-r lg:border-[#203027]/25 lg:py-28 lg:pr-16">
              <p className="text-[12px] font-semibold text-[#B9472A]">Acesso fundador aberto</p>
              <h1 className="mt-7 max-w-3xl font-serif text-[clamp(3.25rem,7vw,6rem)] font-normal leading-[0.94] tracking-[-0.045em]">
                Comunidade para quem trabalha com operações jurídicas.
              </h1>
              <p className="mt-8 max-w-2xl text-lg leading-8 text-[#203027]/68">
                Traga uma questão de CLM, automação, métricas, fornecedores ou desenho de processos. Compare caminhos com quem enfrenta o mesmo tipo de trabalho.
              </p>
              <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Link
                  href={firstTierCheckout}
                  className="group inline-flex items-center gap-3 rounded-sm bg-[#203027] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#B9472A]"
                >
                  Participar do primeiro lote
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <span className="text-sm text-[#203027]/55">
                  {formatBRL(firstTier.annualPrice)} por ano
                </span>
              </div>
            </div>

            <aside className="bg-[#E8E1D4] px-5 py-12 sm:px-8 lg:flex lg:flex-col lg:justify-center lg:px-10 lg:py-16">
              <p className="font-serif text-2xl leading-snug">
                Você entra porque há um problema na sua mesa, não para acompanhar mais um feed.
              </p>
              <div className="mt-10 border-t border-[#203027]/30 pt-6 text-sm leading-7 text-[#203027]/65">
                <p>
                  Publique o contexto, diga o que já tentou e explique onde a decisão travou. É daí que uma conversa útil começa.
                </p>
                <p className="mt-5 font-medium text-[#203027]">
                  Para profissionais de jurídico que respondem pela operação.
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section id="conversas" className="scroll-mt-16 border-b border-[#203027]/25 bg-[#FBF8F1]">
          <div className="mx-auto max-w-[1120px] px-5 py-16 sm:px-8 sm:py-20">
            <div className="flex flex-col justify-between gap-5 border-b border-[#203027]/30 pb-7 sm:flex-row sm:items-end">
              <div>
                <p className="text-[12px] font-semibold text-[#B9472A]">Prévia pública</p>
                <h2 className="mt-3 font-serif text-4xl tracking-[-0.03em] sm:text-5xl">Conversas abertas agora</h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-[#203027]/55">
                O restante da discussão fica disponível para membros.
              </p>
            </div>

            <div className="divide-y divide-[#203027]/20">
              {publicPosts.slice(0, 2).map(post => (
                <article key={post.id} className="grid gap-5 py-8 md:grid-cols-[10rem_1fr_auto] md:gap-8">
                  <div className="flex items-center gap-3 md:items-start">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#DED6C8] text-[11px] font-bold">
                      {getInitials(post.author_name)}
                    </span>
                    <div>
                      <p className="text-xs font-semibold">{post.author_name}</p>
                      <p className="mt-1 text-[11px] text-[#203027]/45">{post.author_role || 'Membro'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-[#B9472A]">
                      {COMMUNITY_CATEGORIES[post.category]?.label ?? 'Discussão'}
                    </p>
                    <h3 className="mt-2 font-serif text-2xl leading-tight tracking-[-0.02em]">{post.title}</h3>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-[#203027]/60">{post.body}</p>
                  </div>
                  <p className="flex items-center gap-2 self-end text-[11px] text-[#203027]/45 md:justify-self-end">
                    <Lock className="h-3.5 w-3.5" /> Para membros
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="formato" className="scroll-mt-16 border-b border-[#203027]/25">
          <div className="mx-auto grid max-w-[1120px] lg:grid-cols-[0.85fr_1.15fr]">
            <div className="px-5 py-16 sm:px-8 sm:py-20 lg:border-r lg:border-[#203027]/25 lg:pr-14">
              <p className="text-[12px] font-semibold text-[#B9472A]">Como funciona</p>
              <h2 className="mt-4 font-serif text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">
                A conversa começa no trabalho real.
              </h2>
              <div className="mt-7 space-y-5 text-base leading-7 text-[#203027]/65">
                <p>
                  Um membro publica uma situação com contexto suficiente para os outros entenderem a decisão.
                </p>
                <p>
                  Quando vale aprofundar, o assunto vai para um encontro ao vivo. Depois, a síntese registra argumentos, referências e perguntas que ficaram abertas.
                </p>
              </div>
            </div>

            <div className="px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
              <p className="mb-3 text-sm font-semibold">A participação inclui</p>
              <div className="divide-y divide-[#203027]/20 border-y border-[#203027]/20">
                {membershipIncludes.map((item, index) => (
                  <div key={item.title} className="grid gap-2 py-6 sm:grid-cols-[2rem_11rem_1fr] sm:gap-5">
                    <span className="text-[11px] text-[#B9472A]">{String(index + 1).padStart(2, '0')}</span>
                    <h3 className="text-sm font-semibold">{item.title}</h3>
                    <p className="text-sm leading-6 text-[#203027]/58">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="assuntos" className="scroll-mt-16 border-b border-[#203027]/25 bg-[#203027] text-[#F4F0E7]">
          <div className="mx-auto grid max-w-[1120px] gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
            <div>
              <p className="text-[12px] font-semibold text-[#E07A59]">Assuntos da comunidade</p>
              <h2 className="mt-4 font-serif text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">
                O escopo é amplo. O contexto é sempre jurídico.
              </h2>
              <p className="mt-6 max-w-md text-sm leading-6 text-white/55">
                Os espaços acompanham as frentes de trabalho de Legal Ops e podem mudar conforme as conversas evoluem.
              </p>
            </div>

            <div className="grid border-t border-white/25 sm:grid-cols-2">
              {topicKeys.map((key, index) => {
                const topic = COMMUNITY_CATEGORIES[key]
                return (
                  <div
                    key={key}
                    className={`flex gap-4 border-b border-white/20 py-4 sm:px-5 ${index % 2 === 0 ? 'sm:border-r sm:pl-0' : 'sm:pr-0'}`}
                  >
                    <span className="mt-1 text-[10px] text-[#E07A59]">{String(index + 1).padStart(2, '0')}</span>
                    <span className="text-sm text-white/85">{topic.title}</span>
                  </div>
                )
              })}
              <p className="py-5 text-[10px] leading-5 text-white/38 sm:col-span-2">
                O LegalOps Club é independente e não tem afiliação com a CLOC. O{' '}
                <a
                  href="https://cloc.org/cloc-core-12/"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-white/35 underline-offset-2 hover:decoration-white"
                >
                  Core 12
                </a>{' '}
                é uma das referências usadas na organização dos temas.
              </p>
            </div>
          </div>
        </section>

        <section id="valor" className="scroll-mt-16 border-b border-[#203027]/25 bg-[#FBF8F1]">
          <div className="mx-auto grid max-w-[1120px] lg:grid-cols-[0.8fr_1.2fr]">
            <div className="px-5 py-16 sm:px-8 sm:py-20 lg:border-r lg:border-[#203027]/25 lg:pr-14">
              <p className="text-[12px] font-semibold text-[#B9472A]">Primeiro lote</p>
              <h2 className="mt-4 font-serif text-5xl tracking-[-0.04em] sm:text-6xl">
                {formatBRL(firstTier.annualPrice)}{' '}
                <span className="text-2xl text-[#203027]/45">por ano</span>
              </h2>
              <p className="mt-6 max-w-md text-base leading-7 text-[#203027]/62">
                O primeiro lote tem {firstTier.memberTo} vagas. Quem entra nele mantém esse valor nas próximas renovações.
              </p>
              <Link
                href={firstTierCheckout}
                className="group mt-8 inline-flex items-center gap-3 rounded-sm bg-[#B9472A] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#203027]"
              >
                Entrar no primeiro lote
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <p className="mt-4 text-[11px] text-[#203027]/45">Pagamento anual. Acesso liberado após a confirmação.</p>
            </div>

            <div className="px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
              <div className="flex items-end justify-between border-b border-[#203027]/30 pb-4">
                <h3 className="font-serif text-2xl">Tabela de lançamento</h3>
                <span className="text-[11px] text-[#203027]/45">Preço anual</span>
              </div>
              <div className="divide-y divide-[#203027]/20">
                {CLUB_LAUNCH_TIERS.map((tier, index) => (
                  <div key={tier.id} className="grid grid-cols-[2rem_1fr_auto] items-center gap-4 py-5">
                    <span className="text-[10px] text-[#B9472A]">{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <p className="text-sm font-semibold">Membros {tier.memberFrom} a {tier.memberTo}</p>
                      <p className="mt-1 text-[11px] text-[#203027]/45">{tier.name}</p>
                    </div>
                    <p className="font-serif text-xl">{formatBRL(tier.annualPrice)}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 border-t border-[#203027]/30 pt-5 text-xs leading-5 text-[#203027]/50">
                O valor muda quando o lote atinge o limite de membros. A experiência do Club é a mesma em todos os lotes.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#F4F0E7] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-4 text-xs text-[#203027]/45 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-semibold tracking-[0.08em] text-[#203027]">LEGALOPS CLUB</span>
          <span>Uma comunidade independente de operações jurídicas.</span>
        </div>
      </footer>
    </div>
  )
}
