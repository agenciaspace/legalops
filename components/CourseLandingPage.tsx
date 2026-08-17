import {
  ArrowRight,
  Bot,
  Check,
  Database,
  MessageCircle,
  Server,
  Sparkles,
  Terminal,
} from 'lucide-react'

const stack = [
  ['Termius', 'Acesso e operação do servidor pelo celular ou computador.', Terminal],
  ['Supabase', 'Banco, autenticação e contexto persistente para o assistente.', Database],
  ['Hostinger', 'Servidor acessível, deploy e rotina de manutenção.', Server],
  ['Provider de IA', 'Conexão com o modelo que combina com custo e objetivo.', Sparkles],
] as const

const takeaways = [
  'Entender a arquitetura antes de copiar código',
  'Subir um serviço real e acompanhar o servidor',
  'Guardar contexto e histórico das conversas',
  'Trocar o provider sem refazer a integração',
]

const contactHref = 'mailto:leonhatori@gmail.com?subject=Quero participar da aula de IA no WhatsApp'

export function CourseLandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#08111f] text-slate-100 selection:bg-cyan-300 selection:text-slate-950">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] [background-size:48px_48px]" />

      <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <a href="#inicio" className="flex items-center gap-2 text-sm font-semibold tracking-tight text-white">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-300 text-slate-950"><Bot className="h-4 w-4" /></span>
          IA na prática
        </a>
        <a href="#programa" className="hidden text-sm text-slate-300 transition hover:text-cyan-200 sm:block">Ver o programa ↓</a>
      </nav>

      <section id="inicio" className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:pb-28 lg:pt-20">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-xs font-medium text-cyan-200"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />Aula prática · do zero ao primeiro fluxo</div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-6xl">Seu assistente de IA no WhatsApp, <span className="text-cyan-300">construído de verdade.</span></h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">Vou abrir o bastidor do projeto: servidor, banco, mensagens, contexto e modelo de IA. Uma aula para sair da ideia e enxergar cada peça funcionando.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href={contactHref} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200">Quero participar <ArrowRight className="h-4 w-4" /></a>
            <a href="#programa" className="inline-flex items-center justify-center rounded-xl border border-white/15 px-5 py-3.5 text-sm font-semibold text-white transition hover:border-cyan-300/50 hover:bg-white/5">Ver o que vou aprender</a>
          </div>
          <p className="mt-4 text-xs text-slate-500">Sem promessa de ferramenta mágica: arquitetura, decisões e execução.</p>
        </div>

        <div className="relative mx-auto w-full max-w-lg">
          <div className="absolute -inset-8 rounded-[2rem] bg-cyan-400/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#0c192b]/95 shadow-2xl shadow-cyan-950/40">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-xs text-slate-500"><span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-300/80" /><span className="ml-2 font-mono">assistant · live</span></div>
            <div className="space-y-5 p-5 font-mono text-[12px] leading-6 sm:p-7 sm:text-[13px]">
              <div className="flex gap-3"><span className="text-cyan-300">$</span><span className="text-slate-300">termius connect hostinger</span></div>
              <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 text-slate-400"><p><span className="text-emerald-300">✓</span> server online</p><p><span className="text-emerald-300">✓</span> supabase connected</p><p><span className="text-emerald-300">✓</span> ai provider ready</p></div>
              <div className="flex items-start gap-3"><span className="mt-1 text-emerald-300">whatsapp</span><div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-emerald-400/15 px-4 py-2.5 text-slate-200">Como posso ajudar hoje?</div></div>
              <div className="flex items-start justify-end gap-3"><div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-cyan-300/15 px-4 py-2.5 text-cyan-100">Quero consultar meu histórico.</div><span className="mt-1 text-cyan-300">você</span></div>
              <div className="flex gap-3 text-slate-500"><span className="text-cyan-300">$</span><span>context → resposta → memória</span><span className="animate-pulse text-cyan-300">▌</span></div>
            </div>
          </div>
          <div className="absolute -bottom-5 -left-5 hidden items-center gap-2 rounded-xl border border-white/10 bg-[#10223a] px-3 py-2 text-xs text-slate-300 shadow-xl sm:flex"><MessageCircle className="h-4 w-4 text-emerald-300" />WhatsApp + IA + dados</div>
        </div>
      </section>

      <section id="programa" className="relative border-y border-white/10 bg-white/[0.025]"><div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-24"><div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">O que entra na aula</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">A pilha inteira, explicada sem atalhos.</h2><p className="mt-4 leading-7 text-slate-400">Você vai entender como as partes conversam e quais decisões fazem diferença quando o protótipo precisa continuar funcionando depois da demonstração.</p></div><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stack.map(([label, description, Icon]) => <div key={label} className="rounded-2xl border border-white/10 bg-[#0c192b] p-5 transition hover:-translate-y-1 hover:border-cyan-300/35"><Icon className="h-5 w-5 text-cyan-300" /><h3 className="mt-8 font-semibold text-white">{label}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{description}</p></div>)}</div></div></section>

      <section className="relative mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:py-24"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Ao final</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">Mais clareza para construir o seu.</h2><p className="mt-5 leading-7 text-slate-400">A proposta não é sair com uma receita engessada. É saber onde cada peça entra e como continuar evoluindo o projeto.</p></div><div className="grid gap-3 sm:grid-cols-2">{takeaways.map(item => <div key={item} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-300"><Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />{item}</div>)}</div></section>

      <section id="inscricao" className="relative mx-auto max-w-6xl px-5 pb-20 sm:px-8 lg:pb-28"><div className="flex flex-col items-start justify-between gap-7 rounded-3xl border border-cyan-300/25 bg-cyan-300/10 p-7 sm:p-10 lg:flex-row lg:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">Quer acompanhar?</p><h2 className="mt-3 max-w-xl text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">Me chama e eu te envio os detalhes da aula.</h2></div><a href={contactHref} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100">Falar comigo <ArrowRight className="h-4 w-4" /></a></div></section>

      <footer className="relative border-t border-white/10 px-5 py-7 sm:px-8"><div className="mx-auto flex max-w-6xl flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>IA na prática · uma aula aberta sobre construção.</span><span>Termius · Supabase · Hostinger · seu provider de IA</span></div></footer>
    </main>
  )
}
