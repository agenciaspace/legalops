import { ArrowRight } from 'lucide-react'
import { BrandMark, BrandWordmark } from '@/components/BrandLogo'

const contactHref = 'mailto:leonhatori@gmail.com?subject=Quero participar da aula de IA no WhatsApp'

const roundedFont = { fontFamily: 'var(--font-quicksand), ui-rounded, sans-serif' }
const bodyFont = { fontFamily: 'var(--font-inter), sans-serif' }

const architecture = [
  ['01', 'entrada', 'WhatsApp', 'a mensagem chega pelo canal'],
  ['02', 'ponte', 'Webhook', 'o evento é validado e encaminhado'],
  ['03', 'contexto', 'Supabase', 'histórico e dados entram na consulta'],
  ['04', 'modelo', 'Provider de IA', 'o contexto vira uma resposta'],
  ['05', 'saída', 'WhatsApp', 'a resposta volta para a conversa'],
] as const

const stack = [
  ['WhatsApp / Uazapi', 'canal, instância e troca de mensagens'],
  ['Supabase', 'dados, histórico, autenticação e contexto'],
  ['Hostinger', 'backend, deploy e processo em execução'],
  ['Termius', 'acesso ao servidor e operação por SSH'],
  ['Provider de IA', 'modelo, contexto, custo e limites'],
] as const

const levels = [
  {
    number: '01',
    label: 'prototipar',
    title: 'colocar o primeiro fluxo no ar',
    text: 'Conectar o número, receber uma mensagem, buscar contexto, chamar o modelo e devolver uma resposta.',
    steps: ['conectar o canal', 'estruturar os dados', 'montar o fluxo'],
  },
  {
    number: '02',
    label: 'operar',
    title: 'entender o que mantém o sistema vivo',
    text: 'Sair da demonstração e olhar para servidor, credenciais, logs, falhas e manutenção como parte do produto.',
    steps: ['publicar o backend', 'separar segredos', 'acompanhar a operação'],
  },
] as const

const takeaways = [
  'entender a arquitetura antes de copiar código',
  'saber onde dados e contexto entram no fluxo',
  'separar canal, backend, banco e modelo',
  'continuar evoluindo sem depender de uma ferramenta única',
] as const

export function CourseLandingPage() {
  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#111111]" style={bodyFont}>
      <header className="sticky top-0 z-50 border-b border-[#CEC8BD]/80 bg-[#F5F1E8]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between px-5 sm:px-8">
          <a href="#inicio" aria-label="legalops.dev" className="flex min-w-0 items-center">
            <BrandWordmark
              suffix="dev"
              className="inline-flex items-baseline text-[22px] font-medium leading-none tracking-[-0.065em] text-[#111111] sm:text-[27px]"
            />
          </a>

          <nav className="flex items-center gap-0.5 text-xs font-semibold text-[#66615B] sm:gap-1 sm:text-sm" aria-label="Navegação principal">
            <a href="#arquitetura" className="hidden rounded-full px-3 py-2 transition hover:bg-white/70 hover:text-[#111111] sm:inline-flex">
              arquitetura
            </a>
            <a href="https://legalops.work" className="rounded-full px-3 py-2 transition hover:bg-white/70 hover:text-[#111111]">
              work
            </a>
            <a href="https://legalops.club" className="rounded-full px-3 py-2 transition hover:bg-white/70 hover:text-[#111111]">
              club
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section id="inicio" className="relative overflow-hidden border-b border-[#CEC8BD]">
          <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(rgba(17,17,17,.08)_0.7px,transparent_0.7px)] [background-size:20px_20px]" />
          <div className="pointer-events-none absolute -right-28 -top-36 h-[430px] w-[430px] rounded-full border-[74px] border-[#E88A6A]/[0.08]" />

          <div className="relative mx-auto grid max-w-[1180px] gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.06fr_.94fr] lg:items-center lg:gap-16 lg:py-28">
            <div>
              <div className="inline-flex items-center rounded-full border border-[#CEC8BD] bg-white/55 px-3 py-1.5 text-[11px] font-bold tracking-[0.13em] text-[#66615B]">
                BUILD 001 · IA NO WHATSAPP
              </div>

              <h1
                className="mt-7 max-w-[720px] text-[42px] font-semibold leading-[0.98] tracking-[-0.065em] sm:text-[64px] lg:text-[76px]"
                style={roundedFont}
              >
                entenda o sistema. depois construa o seu<span className="text-[#E88A6A]">.</span>
              </h1>

              <p className="mt-7 max-w-[650px] text-base leading-7 text-[#625E59] sm:text-lg sm:leading-8">
                Uma aula aberta para montar um assistente no WhatsApp e enxergar o que acontece entre mensagem, backend, banco e modelo — sem esconder a arquitetura atrás de uma ferramenta.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={contactHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#111111] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#2A2927]"
                >
                  participar da aula <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#arquitetura"
                  className="inline-flex items-center justify-center rounded-full border border-[#CEC8BD] bg-white/55 px-5 py-3 text-sm font-bold text-[#111111] transition hover:bg-white"
                >
                  ver a arquitetura
                </a>
              </div>

              <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-[#77716A]">
                <span>arquitetura</span>
                <span className="h-1 w-1 rounded-full bg-[#E88A6A]" />
                <span>dados</span>
                <span className="h-1 w-1 rounded-full bg-[#E88A6A]" />
                <span>automação</span>
              </div>
            </div>

            <div className="mx-auto w-full max-w-[500px] lg:mx-0 lg:ml-auto">
              <div className="relative overflow-hidden rounded-[34px] border border-[#CEC8BD] bg-[#111111] p-7 text-white shadow-[0_30px_70px_rgba(17,17,17,0.16)] sm:p-9">
                <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full border-[40px] border-white/[0.035]" />
                <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full border-[42px] border-[#E88A6A]/10" />

                <div className="relative">
                  <div className="flex items-start justify-between gap-5">
                    <BrandMark className="h-14 w-auto text-white" />
                    <span className="pt-1 text-right text-[10px] font-bold tracking-[0.16em] text-white/45">BUILD 001<br />SYSTEM MAP</span>
                  </div>

                  <div className="mt-9 border-t border-white/12">
                    {architecture.map(([number, role, name]) => (
                      <div key={number} className="grid grid-cols-[34px_1fr_auto] items-center gap-3 border-b border-white/12 py-4">
                        <span className="text-[10px] font-bold tracking-[0.12em] text-[#E88A6A]">{number}</span>
                        <span className="text-sm font-semibold text-white">{name}</span>
                        <span className="text-[10px] font-semibold tracking-[0.08em] text-white/40">{role}</span>
                      </div>
                    ))}
                  </div>

                  <p className="mt-6 max-w-[360px] text-xs leading-5 text-white/55">
                    O objetivo não é decorar uma stack. É entender as fronteiras entre as peças para conseguir trocar, depurar e evoluir cada uma delas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="arquitetura" className="scroll-mt-24 border-b border-[#CEC8BD] bg-[#FAF7F1]">
          <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 sm:py-24">
            <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
              <div>
                <p className="text-[11px] font-bold tracking-[0.16em] text-[#C9684F]">01 / ARQUITETURA</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl" style={roundedFont}>
                  uma mensagem atravessa um sistema inteiro<span className="text-[#E88A6A]">.</span>
                </h2>
                <p className="mt-5 max-w-[470px] text-sm leading-6 text-[#69635E] sm:text-base sm:leading-7">
                  Na aula, cada camada aparece separada. Assim fica claro o que recebe a mensagem, o que guarda estado, o que executa lógica e o que pode ser substituído depois.
                </p>
              </div>

              <div className="border-t border-[#CEC8BD]">
                {architecture.map(([number, role, name, description]) => (
                  <div key={number} className="grid gap-2 border-b border-[#CEC8BD] py-5 sm:grid-cols-[48px_110px_150px_1fr] sm:items-baseline sm:gap-4">
                    <span className="text-[10px] font-bold tracking-[0.13em] text-[#C9684F]">{number}</span>
                    <span className="text-[11px] font-bold tracking-[0.1em] text-[#817A73]">{role.toUpperCase()}</span>
                    <strong className="text-sm font-semibold text-[#111111]">{name}</strong>
                    <span className="text-sm leading-6 text-[#69635E]">{description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#CEC8BD]">
          <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 sm:py-24">
            <div className="max-w-[680px]">
              <p className="text-[11px] font-bold tracking-[0.16em] text-[#C9684F]">02 / STACK</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl" style={roundedFont}>
                ferramentas entram como peças, não como promessa<span className="text-[#E88A6A]">.</span>
              </h2>
            </div>

            <div className="mt-10 grid border-y border-[#CEC8BD] md:grid-cols-5">
              {stack.map(([name, description], index) => (
                <div
                  key={name}
                  className={`py-6 md:px-5 md:py-7 ${index > 0 ? 'border-t border-[#E6DED0] md:border-l md:border-t-0' : ''}`}
                >
                  <span className="text-[10px] font-bold tracking-[0.14em] text-[#C9684F]">0{index + 1}</span>
                  <h3 className="mt-4 text-base font-semibold tracking-[-0.025em] text-[#111111]" style={roundedFont}>{name}</h3>
                  <p className="mt-2 text-xs leading-5 text-[#69635E]">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[#CEC8BD] bg-[#FAF7F1]">
          <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 sm:py-24">
            <div className="max-w-[680px]">
              <p className="text-[11px] font-bold tracking-[0.16em] text-[#C9684F]">03 / CAMINHO</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl" style={roundedFont}>
                primeiro funciona. depois fica sustentável<span className="text-[#E88A6A]">.</span>
              </h2>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              {levels.map(level => (
                <article key={level.number} className="border-t border-[#CEC8BD] pt-5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-bold tracking-[0.14em] text-[#C9684F]">{level.number}</span>
                    <span className="text-[10px] font-bold tracking-[0.14em] text-[#817A73]">{level.label.toUpperCase()}</span>
                  </div>
                  <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl" style={roundedFont}>{level.title}<span className="text-[#E88A6A]">.</span></h3>
                  <p className="mt-4 max-w-[520px] text-sm leading-6 text-[#69635E]">{level.text}</p>
                  <div className="mt-7 border-t border-[#E6DED0]">
                    {level.steps.map((step, index) => (
                      <div key={step} className="flex items-center gap-4 border-b border-[#E6DED0] py-3 text-sm text-[#5F5A55]">
                        <span className="text-[10px] font-bold text-[#C9684F]">0{index + 1}</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[.78fr_1.22fr] lg:gap-20">
            <div>
              <p className="text-[11px] font-bold tracking-[0.16em] text-[#C9684F]">04 / SAÍDA</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl" style={roundedFont}>
                sair sabendo continuar<span className="text-[#E88A6A]">.</span>
              </h2>
            </div>
            <div className="border-t border-[#CEC8BD]">
              {takeaways.map((item, index) => (
                <div key={item} className="grid grid-cols-[36px_1fr] gap-3 border-b border-[#CEC8BD] py-5 text-sm leading-6 text-[#5F5A55] sm:text-base">
                  <span className="text-[10px] font-bold tracking-[0.12em] text-[#C9684F]">0{index + 1}</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-16 sm:px-8 sm:pb-24">
          <div className="mx-auto max-w-[1120px] overflow-hidden rounded-[30px] bg-[#111111] px-6 py-10 text-white sm:px-10 sm:py-12 md:flex md:items-center md:justify-between md:gap-10">
            <div>
              <p className="text-[11px] font-bold tracking-[0.14em] text-[#E88A6A]">LEGALOPS.DEV / BUILD 001</p>
              <h2 className="mt-3 max-w-[680px] text-2xl font-semibold tracking-[-0.045em] sm:text-4xl" style={roundedFont}>
                quer construir esse fluxo junto?
              </h2>
              <p className="mt-3 max-w-[590px] text-sm leading-6 text-white/60">Me chama e eu envio os detalhes da aula.</p>
            </div>
            <a
              href={contactHref}
              className="mt-7 inline-flex shrink-0 items-center gap-2 rounded-full bg-[#E88A6A] px-5 py-3 text-sm font-bold text-[#111111] transition hover:-translate-y-0.5 hover:bg-[#DE7B5C] md:mt-0"
            >
              participar <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#CEC8BD] bg-[#FAF7F1] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <BrandWordmark suffix="dev" className="inline-flex items-baseline text-[23px] font-medium leading-none tracking-[-0.065em] text-[#111111]" />
          <div className="flex flex-wrap items-center gap-5 text-xs font-semibold text-[#716B65]">
            <a href="https://legalops.work" className="hover:text-[#111111]">work</a>
            <a href="https://legalops.club" className="hover:text-[#111111]">club</a>
            <a href={contactHref} className="hover:text-[#111111]">contato</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
