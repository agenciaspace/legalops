import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  CalendarDays,
  Check,
  Database,
  FileCheck2,
  Library,
  Lock,
  MessageCircle,
  Network,
  Radio,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'
import { BrandMark } from '@/components/BrandLogo'
import { CLUB_LAUNCH_MEMBER_GOAL, CLUB_LAUNCH_TIERS, formatBRL } from '@/lib/club-pricing'
import { COMMUNITY_CATEGORIES, getInitials } from '@/lib/community'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const metadata: Metadata = {
  title: 'LegalOps Club — Comunidade de Legal Operations',
  description: 'Comunidades, discussões, lives, resumos por IA e perfis validados para quem constrói operações jurídicas melhores.',
}

const publicPostFallback = [
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

const topicIcons = [Bot, Database, FileCheck2, MessageCircle, Sparkles, ShieldCheck, Library, Target, Network, Users]

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

  const publicPosts = rawPublicPosts && rawPublicPosts.length >= 2 ? rawPublicPosts : publicPostFallback

  return (
    <div className="min-h-screen overflow-hidden bg-[#F6F3EC] text-[#191815]">
      <header className="relative z-20 border-b border-[#191815]/10 bg-[#F6F3EC]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/club" className="flex items-center gap-3" aria-label="LegalOps Club">
            <BrandMark className="h-9 w-9 text-[#191815]" />
            <div>
              <div className="text-sm font-extrabold uppercase tracking-[0.16em]">LegalOps</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#FF5C1A]">Club</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#191815]/65 md:flex">
            <a href="#comunidade" className="hover:text-[#191815]">Comunidade</a>
            <a href="#temas" className="hover:text-[#191815]">Temas</a>
            <a href="#resumos" className="hover:text-[#191815]">Resumos IA</a>
            <a href="#planos" className="hover:text-[#191815]">Planos</a>
          </nav>

          <Link
            href="/login?next=/community"
            className="rounded-full border border-[#191815]/15 bg-white px-4 py-2 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:border-[#191815]/30"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main>
        <section className="relative">
          <div className="absolute -right-36 -top-44 h-[34rem] w-[34rem] rounded-full bg-[#FF5C1A]/10 blur-3xl" />
          <div className="absolute -left-48 top-40 h-96 w-96 rounded-full bg-emerald-300/10 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 lg:grid-cols-[0.82fr_1.18fr] lg:px-8 lg:pb-28 lg:pt-24">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#FF5C1A]/25 bg-[#FF5C1A]/8 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-[#C53D0A]">
                <Sparkles className="h-3.5 w-3.5" />
                Acesso fundador aberto
              </div>
              <h1 className="max-w-xl text-5xl font-black leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                O jurídico muda. <span className="text-[#FF5C1A]">Quem opera, lidera.</span>
              </h1>
              <p className="mt-7 max-w-lg text-lg leading-8 text-[#191815]/65">
                Comunidades para quem está redesenhando operações jurídicas — com discussões úteis, lives, sínteses por IA e pares com identidade validada.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login?next=/community"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#191815] px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5"
                >
                  Entrar para o Club
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <a
                  href="#comunidade"
                  className="inline-flex items-center justify-center rounded-full border border-[#191815]/15 bg-white/70 px-6 py-3.5 text-sm font-extrabold transition hover:bg-white"
                >
                  Ver como funciona
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[#191815]/55">
                <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-600" /> Feed sem algoritmo</span>
                <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-600" /> Resumos semanais por IA</span>
                <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-600" /> Perfis validados</span>
              </div>
            </div>

            <div id="comunidade" className="relative mx-auto w-full max-w-3xl scroll-mt-24">
              <div className="absolute -inset-5 rotate-2 rounded-[2rem] bg-[#FF5C1A]/10" />
              <div className="relative overflow-hidden rounded-[1.65rem] border border-[#191815]/10 bg-white shadow-2xl shadow-[#3D2B1F]/15">
                <div className="flex items-center justify-between border-b border-[#191815]/8 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#191815] text-xs font-black text-white">LO</div>
                    <div>
                      <p className="text-sm font-extrabold">LegalOps Club</p>
                      <p className="text-[11px] text-[#191815]/45">Comunidade profissional</p>
                    </div>
                  </div>
                  <div className="hidden gap-1 text-[11px] font-bold text-[#191815]/55 sm:flex">
                    <span className="rounded-lg bg-[#FF5C1A]/10 px-3 py-1.5 text-[#D54710]">Comunidade</span>
                    <span className="px-3 py-1.5">Resumos IA</span>
                    <span className="px-3 py-1.5">Lives</span>
                  </div>
                </div>

                <div className="grid gap-4 bg-[#F8F6F1] p-4 sm:grid-cols-[1fr_12rem] sm:p-5">
                  <div className="space-y-3">
                    {publicPosts.slice(0, 2).map((post, index) => (
                      <div key={post.id} className="rounded-2xl border border-[#191815]/8 bg-white p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-black text-white ${index === 0 ? 'bg-[#FF5C1A]' : 'bg-emerald-700'}`}>{getInitials(post.author_name)}</div>
                          <div className="flex-1">
                            <p className="text-xs font-extrabold">{post.author_name}</p>
                            <p className="text-[10px] text-[#191815]/40">{post.author_role || 'Membro'} · prévia aberta</p>
                          </div>
                          {index === 0 ? <span className="rounded-full bg-orange-100 px-2 py-1 text-[9px] font-black uppercase text-orange-800">Aberto</span> : null}
                        </div>
                        <h3 className="text-sm font-extrabold">{post.title}</h3>
                        <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[#191815]/60">{post.body}</p>
                        <div className="mt-3 flex items-center gap-2 border-t border-[#191815]/6 pt-3 text-[10px] font-bold text-[#191815]/45"><Lock className="h-3 w-3" /> Discussão completa para membros</div>
                      </div>
                    ))}
                  </div>
                  <aside className="space-y-3">
                    <div className="rounded-2xl bg-[#191815] p-4 text-white">
                      <div className="flex items-center justify-between">
                        <Sparkles className="h-4 w-4 text-[#FF7A45]" />
                        <span className="text-[9px] font-bold uppercase tracking-wider text-white/50">Resumo IA</span>
                      </div>
                      <p className="mt-5 text-xs font-extrabold">Radar da semana</p>
                      <p className="mt-2 text-[9px] leading-4 text-white/55">Ideias, divergências e próximos pontos organizados automaticamente.</p>
                    </div>
                    <div className="rounded-2xl border border-[#191815]/8 bg-white p-4">
                      <CalendarDays className="h-4 w-4 text-[#FF5C1A]" />
                      <p className="mt-3 text-[9px] font-black uppercase tracking-wider text-[#FF5C1A]">Próxima live</p>
                      <p className="mt-1 text-xs font-extrabold leading-4">Office hours: desafios reais</p>
                      <p className="mt-2 text-[10px] text-[#191815]/45">Quinta · 19h</p>
                    </div>
                  </aside>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#191815]/8 bg-[#191815] text-white">
          <div className="mx-auto grid max-w-7xl divide-y divide-white/10 px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:px-8">
            {[
              [MessageCircle, 'Discussão útil', 'Perguntas reais, respostas com contexto e troca sem ruído.'],
              [Sparkles, 'Síntese por IA', 'Os aprendizados e divergências da semana organizados sem perder contexto.'],
              [BadgeCheck, 'Rede validada', 'Perfis claros e conferidos para encontrar os pares certos.'],
            ].map(([Icon, title, description]) => {
              const FeatureIcon = Icon as typeof MessageCircle
              return (
                <div key={title as string} className="py-8 sm:px-7 sm:first:pl-0 sm:last:pr-0">
                  <FeatureIcon className="h-5 w-5 text-[#FF6B30]" />
                  <h2 className="mt-4 text-base font-extrabold">{title as string}</h2>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-white/55">{description as string}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section id="temas" className="scroll-mt-20 px-5 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#FF5C1A]">Comunidades temáticas</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">O tema certo, com gente que vive o problema.</h2>
              <p className="mt-5 text-base leading-7 text-[#191815]/60">Espaços orientados pelos temas mais latentes de Legal Ops no Brasil e conectados às competências do CLOC Core 12.</p>
            </div>
            <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {topicKeys.map((key, index) => {
                const topic = COMMUNITY_CATEGORIES[key]
                const TopicIcon = topicIcons[index]
                return (
                  <article key={key} className="rounded-2xl border border-[#191815]/10 bg-white p-5 shadow-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF0E9] text-[#D9470F]"><TopicIcon className="h-[18px] w-[18px]" /></div>
                    <h3 className="mt-5 text-sm font-extrabold tracking-[-0.015em]">{topic.title}</h3>
                    <p className="mt-2 text-[11px] leading-5 text-[#191815]/55">{topic.description}</p>
                  </article>
                )
              })}
            </div>
            <p className="mt-6 text-[10px] leading-5 text-[#191815]/45">LegalOps Club é uma comunidade independente, sem afiliação com a CLOC. A estrutura usa o <a href="https://cloc.org/cloc-core-12/" target="_blank" rel="noreferrer" className="font-bold text-[#D9470F] hover:underline">Core 12</a> como referência de competências.</p>
          </div>
        </section>

        <section id="resumos" className="scroll-mt-20 border-y border-[#191815]/8 bg-white px-5 py-20 lg:px-8 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#FF5C1A]">Memória coletiva</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em]">A conversa continua. A IA não deixa o aprendizado se perder.</h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-[#191815]/60">Toda semana, as discussões viram uma síntese com argumentos, práticas, divergências e perguntas em aberto. O resumo aponta o caminho; a fonte continua sendo a comunidade.</p>
            </div>
            <div className="rounded-[1.5rem] bg-[#292825] p-6 text-white shadow-xl sm:p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#FF8B5D]"><Sparkles className="h-4 w-4" /> Radar LegalOps</div>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[8px] font-bold text-white/60">Semanal</span>
              </div>
              <h3 className="mt-6 text-xl font-extrabold">O que moveu as discussões nesta semana</h3>
              <p className="mt-3 text-sm leading-6 text-white/60">IA governada, métricas que sustentam decisões e adoção como parte do desenho — não como etapa final.</p>
              <div className="mt-6 space-y-3 border-t border-white/10 pt-5 text-xs text-white/70">
                <p className="flex gap-2"><span className="text-[#FF7A45]">01</span> A síntese preserva pontos de vista diferentes.</p>
                <p className="flex gap-2"><span className="text-[#FF7A45]">02</span> O volume de fontes analisadas fica visível.</p>
                <p className="flex gap-2"><span className="text-[#FF7A45]">03</span> Membros voltam à discussão original para aprofundar.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="agenda" className="scroll-mt-20 bg-[#EAE5DB] px-5 py-20 lg:px-8 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#FF5C1A]">Lives do Club</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em]">Discussões que ganham rosto, voz e profundidade.</h2>
              <p className="mt-5 max-w-md text-base leading-7 text-[#191815]/60">As lives partem dos temas que estão aquecidos nas comunidades: encontros para confrontar experiências e avançar perguntas reais.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['01', 'Discuta', 'Traga o problema e o contexto para a comunidade.'],
                ['02', 'Aprofunde ao vivo', 'Encontre pares e convidados em uma conversa direta.'],
                ['03', 'Receba a síntese', 'A IA organiza aprendizados e perguntas para o próximo ciclo.'],
              ].map(([number, title, description]) => (
                <div key={number} className="rounded-2xl border border-[#191815]/10 bg-[#F6F3EC] p-5">
                  <span className="text-xs font-black text-[#FF5C1A]">{number}</span>
                  <h3 className="mt-8 font-extrabold">{title}</h3>
                  <p className="mt-2 text-sm leading-5 text-[#191815]/55">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="planos" className="scroll-mt-20 px-5 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#FF5C1A]">Lotes anuais de lançamento</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">Entre cedo. Mantenha seu preço fundador.</h2>
              <p className="mt-5 text-base leading-7 text-[#191815]/60">São {CLUB_LAUNCH_MEMBER_GOAL} vagas no lançamento. Cada lote fecha quando atinge o número indicado.</p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {CLUB_LAUNCH_TIERS.map(tier => {
                const checkoutHref = checkoutEnvironmentKeys[tier.id] ?? '/login?next=/community'
                return (
                  <article key={tier.id} className={`relative flex flex-col rounded-[1.5rem] border p-6 ${tier.highlight ? 'border-[#FF5C1A] bg-[#292825] text-white shadow-xl' : 'border-[#191815]/10 bg-white'}`}>
                    {tier.highlight ? <span className="absolute -top-3 left-5 rounded-full bg-[#FF5C1A] px-3 py-1 text-[8px] font-black uppercase tracking-wider text-white">Primeiro lote</span> : null}
                    <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${tier.highlight ? 'text-[#FF8B5D]' : 'text-[#D9470F]'}`}>{tier.name}</p>
                    <p className="mt-5 text-4xl font-black tracking-[-0.04em]">{formatBRL(tier.annualPrice)}</p>
                    <p className={`mt-1 text-[10px] font-semibold ${tier.highlight ? 'text-white/50' : 'text-[#191815]/45'}`}>por ano · pagamento único</p>
                    <div className={`my-5 h-px ${tier.highlight ? 'bg-white/10' : 'bg-[#191815]/8'}`} />
                    <p className="text-xs font-extrabold">Membros {tier.memberFrom}–{tier.memberTo}</p>
                    <ul className={`mt-4 flex-1 space-y-2.5 text-[10px] leading-4 ${tier.highlight ? 'text-white/65' : 'text-[#191815]/60'}`}>
                      <li className="flex gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" /> Todas as comunidades e discussões</li>
                      <li className="flex gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" /> Lives e resumos semanais por IA</li>
                      <li className="flex gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" /> Diretório com perfis validados</li>
                    </ul>
                    <Link href={checkoutHref} className={`mt-6 inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-xs font-black transition hover:-translate-y-0.5 ${tier.highlight ? 'bg-[#FF5C1A] text-white' : 'bg-[#191815] text-white'}`}>Entrar neste lote <ArrowRight className="h-3.5 w-3.5" /></Link>
                  </article>
                )
              })}
            </div>
            <p className="mt-6 text-center text-[10px] text-[#191815]/45">O acesso completo é liberado após a confirmação do pagamento. A prévia pública continua aberta para todos.</p>
          </div>
        </section>

        <section className="px-5 pb-20 lg:px-8 lg:pb-28">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-[#FF5C1A] px-6 py-14 text-center text-white sm:px-12">
            <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full border-[45px] border-white/10" />
            <ShieldCheck className="relative mx-auto h-7 w-7" />
            <h2 className="relative mx-auto mt-5 max-w-2xl text-4xl font-black tracking-[-0.04em]">Construa o futuro do jurídico com quem está fazendo.</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-sm leading-6 text-white/75">Entre no acesso fundador, valide seu perfil e comece pela discussão que mais se parece com o seu desafio de hoje.</p>
            <Link href={checkoutEnvironmentKeys.founder_199 ?? '/login?next=/community'} className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-black text-[#191815] transition hover:-translate-y-0.5">
              Quero entrar no Club <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#191815]/10 px-5 py-7 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-xs text-[#191815]/45 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-bold uppercase tracking-[0.16em]">LegalOps Club</span>
          <span>Feito para quem transforma o jurídico em operação.</span>
        </div>
      </footer>
    </div>
  )
}
