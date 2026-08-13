import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react'
import { BrandMark } from '@/components/BrandLogo'

export const metadata: Metadata = {
  title: 'LegalOps Club — Comunidade de Legal Operations',
  description: 'Conteúdo prático, encontros ao vivo e conexões para quem constrói operações jurídicas melhores.',
}

const tracks = [
  {
    icon: '🧭',
    eyebrow: 'Comece aqui',
    title: 'Fundamentos de Legal Operations',
    description: 'Diagnóstico, prioridades e um roadmap que o time consegue executar.',
  },
  {
    icon: '📑',
    eyebrow: 'Intermediário',
    title: 'CLM na prática',
    description: 'Processo, tecnologia, adoção e métricas para o ciclo contratual.',
  },
  {
    icon: '✦',
    eyebrow: 'Atualizado em 2026',
    title: 'IA aplicada ao jurídico',
    description: 'Casos de uso, guardrails e um piloto mensurável em 30 dias.',
  },
]

export default function ClubLandingPage() {
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
            <a href="#trilhas" className="hover:text-[#191815]">Trilhas</a>
            <a href="#agenda" className="hover:text-[#191815]">Agenda</a>
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
                A comunidade de quem está redesenhando operações jurídicas — com conteúdo prático, encontros ao vivo e pares que enfrentam os mesmos desafios.
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
                <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-600" /> Trilhas objetivas</span>
                <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-600" /> Networking útil</span>
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
                    <span className="px-3 py-1.5">Trilhas</span>
                    <span className="px-3 py-1.5">Agenda</span>
                  </div>
                </div>

                <div className="grid gap-4 bg-[#F8F6F1] p-4 sm:grid-cols-[1fr_12rem] sm:p-5">
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-[#191815]/8 bg-white p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF5C1A] text-[10px] font-black text-white">LO</div>
                        <div className="flex-1">
                          <p className="text-xs font-extrabold">Equipe LegalOps</p>
                          <p className="text-[10px] text-[#191815]/40">Admin · agora</p>
                        </div>
                        <span className="rounded-full bg-orange-100 px-2 py-1 text-[9px] font-black uppercase text-orange-800">Fixado</span>
                      </div>
                      <h3 className="text-sm font-extrabold">Bem-vindos ao LegalOps Club</h3>
                      <p className="mt-1.5 text-xs leading-5 text-[#191815]/60">Esta é a casa de quem constrói operações jurídicas melhores. Conte o que você está implementando.</p>
                      <div className="mt-3 flex gap-4 border-t border-[#191815]/6 pt-3 text-[10px] font-bold text-[#191815]/45">
                        <span>♡ 24</span><span>◯ 8 comentários</span>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-[#191815]/8 bg-white p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-[10px] font-black text-white">MC</div>
                        <div className="flex-1">
                          <p className="text-xs font-extrabold">Marina Costa</p>
                          <p className="text-[10px] text-[#191815]/40">Legal Ops Manager</p>
                        </div>
                      </div>
                      <h3 className="text-sm font-extrabold">Como vocês medem adoção do CLM?</h3>
                      <p className="mt-1.5 text-xs leading-5 text-[#191815]/60">Além do número de contratos, quais sinais mostram que o negócio incorporou o fluxo?</p>
                    </div>
                  </div>
                  <aside className="space-y-3">
                    <div className="rounded-2xl bg-[#191815] p-4 text-white">
                      <div className="flex items-center justify-between">
                        <Trophy className="h-4 w-4 text-[#FF7A45]" />
                        <span className="text-[9px] font-bold uppercase tracking-wider text-white/50">Nível 2</span>
                      </div>
                      <p className="mt-5 text-xs font-extrabold">Operador</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-2/3 rounded-full bg-[#FF5C1A]" /></div>
                      <p className="mt-1.5 text-[9px] text-white/50">10 pontos para o próximo nível</p>
                    </div>
                    <div className="rounded-2xl border border-[#191815]/8 bg-white p-4">
                      <CalendarDays className="h-4 w-4 text-[#FF5C1A]" />
                      <p className="mt-3 text-[9px] font-black uppercase tracking-wider text-[#FF5C1A]">Próximo encontro</p>
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
              [BookOpen, 'Conteúdo aplicável', 'Aulas curtas, templates e frameworks para usar no trabalho.'],
              [Users, 'Rede especializada', 'Encontre pares por desafio, setor e experiência.'],
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

        <section id="trilhas" className="scroll-mt-20 px-5 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#FF5C1A]">Classroom</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">Menos teoria solta. Mais execução.</h2>
              <p className="mt-5 text-base leading-7 text-[#191815]/60">Trilhas curtas para transformar uma frente nebulosa em um próximo passo claro.</p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {tracks.map((track, index) => (
                <article key={track.title} className="group rounded-[1.5rem] border border-[#191815]/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6F3EC] text-2xl">{track.icon}</div>
                    <span className="text-xs font-black text-[#191815]/20">0{index + 1}</span>
                  </div>
                  <p className="mt-7 text-[10px] font-black uppercase tracking-[0.16em] text-[#FF5C1A]">{track.eyebrow}</p>
                  <h3 className="mt-2 text-xl font-black tracking-[-0.025em]">{track.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#191815]/55">{track.description}</p>
                  <div className="mt-7 flex items-center gap-2 text-xs font-extrabold">4 aulas <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="agenda" className="scroll-mt-20 bg-[#EAE5DB] px-5 py-20 lg:px-8 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#FF5C1A]">Ritmo do Club</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em]">Toda semana, um motivo para avançar.</h2>
              <p className="mt-5 max-w-md text-base leading-7 text-[#191815]/60">A comunidade não é uma biblioteca esquecida. É um ciclo simples de aprender, testar e compartilhar.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['01', 'Aprenda', 'Uma aula curta ou framework prático.'],
                ['02', 'Aplique', 'Teste no contexto real da sua operação.'],
                ['03', 'Compartilhe', 'Traga resultado, dúvida ou ajuste para o grupo.'],
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

        <section className="px-5 py-20 lg:px-8 lg:py-28">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-[#FF5C1A] px-6 py-14 text-center text-white sm:px-12">
            <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full border-[45px] border-white/10" />
            <ShieldCheck className="relative mx-auto h-7 w-7" />
            <h2 className="relative mx-auto mt-5 max-w-2xl text-4xl font-black tracking-[-0.04em]">Construa o futuro do jurídico com quem está fazendo.</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-sm leading-6 text-white/75">Entre no acesso fundador, complete seu perfil e comece pela discussão que mais se parece com o seu desafio de hoje.</p>
            <Link href="/login?next=/community" className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-black text-[#191815] transition hover:-translate-y-0.5">
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
