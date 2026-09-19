import { getClubTranslator } from '@/lib/club-locale-server'
import { ArrowUpRight, BookOpen, FileCheck2, Map, Scale } from 'lucide-react'

export const metadata = { title: 'Recursos | legalops.club', description: 'Recursos práticos da comunidade para o trabalho jurídico.' }
const projects = [
  { title: 'OpenCLM', description: 'Organize pedidos, documentos e aprovações de contratos em um só lugar.', href: 'https://legalops.dev/openclm', action: 'Conhecer o OpenCLM', icon: FileCheck2 },
  { title: 'Playbook de contratos', description: 'Registre posições de negociação, limites e regras de aprovação com a comunidade.', href: '/community/tools/playbook', action: 'Abrir o playbook', icon: BookOpen },
  { title: 'Migração de CLM', description: 'Planeje a mudança de ferramenta, do diagnóstico à adoção, etapa por etapa.', href: '/community/tools/mapa-contratos', action: 'Explorar a jornada', icon: Map },
  { title: 'Avaliação de CLMs', description: 'Compare ferramentas conforme as necessidades da sua empresa e entenda o resultado.', href: 'https://legalops.dev/bench/', action: 'Comparar CLMs', icon: Scale },
]

export default function ToolsPage() {
 const t = getClubTranslator()

  return <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
    <h1 className="text-2xl font-semibold tracking-tight">{t("Recursos")}</h1>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#625E59]">{t("Materiais práticos para apoiar decisões e melhorar o trabalho jurídico.")}</p>
    <div className="mt-6 grid gap-4 sm:grid-cols-2">{projects.map(project => <article key={t(project.title)} className="flex min-w-0 flex-col rounded-2xl border border-[#CEC8BD] bg-white p-5 sm:p-6">
      <project.icon aria-hidden="true" className="h-6 w-6 text-[#A94E38]" />
      <h2 className="mt-4 text-lg font-semibold">{t(project.title)}</h2>
      <p className="mt-2 text-sm leading-6 text-[#625E59]">{t(project.description)}</p>
      <div className="mt-auto pt-5"><a href={project.href} className="flex min-h-12 items-center justify-between gap-3 rounded-xl bg-[#24231F] px-4 py-3 text-sm font-semibold text-white">{t(project.action)}<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" /></a></div>
    </article>)}</div>
    <p className="mt-5 text-xs leading-5 text-[#817A73]">{t("No Playbook e em Migração de CLM, você pode comentar e sugerir melhorias aqui no Club. As contribuições são revisadas antes da publicação.")}</p>
  </main>
}
