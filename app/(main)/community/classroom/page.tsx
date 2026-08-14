import Link from 'next/link'
import { ArrowRight, BookOpen, Clock3, Layers3, Search } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'

type Lesson = { id: string; duration_minutes: number }
type Module = { id: string; community_lessons: Lesson[] }
type Course = {
  id: string
  slug: string
  title: string
  description: string
  emoji: string
  accent: string
  level_label: string
  community_modules: Module[]
}

const accentStyles: Record<string, string> = {
  orange: 'from-[#FFE8DD] via-[#FFF3EC] to-[#FFF9F5] text-[#9B421F]',
  violet: 'from-[#EDE5FF] via-[#F5F0FF] to-[#FBF9FF] text-[#68429A]',
  emerald: 'from-[#DDF3E8] via-[#EDF9F3] to-[#F8FCFA] text-[#286A4A]',
}

export const dynamic = 'force-dynamic'

export default async function ClassroomPage() {
  const supabase = await createServerSupabaseClient()
  const { data: rawCourses } = await supabase
    .from('community_courses')
    .select('id, slug, title, description, emoji, accent, level_label, community_modules(id, community_lessons(id, duration_minutes))')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })

  const courses = (rawCourses ?? []) as Course[]

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-[-0.025em] text-[#24231F]">Trilhas</h1>
          <p className="mt-1 text-xs text-[#77746E]">Conteúdo prático para estruturar e evoluir sua operação jurídica.</p>
        </div>
        <button className="flex h-9 items-center gap-2 rounded-lg border border-[#DFDFDB] bg-white px-3 text-[10px] font-bold text-[#66635E]"><Search className="h-3.5 w-3.5" /> Buscar</button>
      </header>

      <section className="relative mt-5 overflow-hidden rounded-xl bg-[#292825] px-5 py-6 text-white sm:px-7">
        <div className="absolute -right-12 -top-20 h-52 w-52 rounded-full bg-[#FF5C1A]/30 blur-3xl" />
        <div className="relative max-w-xl">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-[#FF9A72]"><BookOpen className="h-3.5 w-3.5" /> Biblioteca LegalOps</div>
          <h2 className="mt-2 text-xl font-extrabold tracking-[-0.025em]">Aprenda hoje. Aplique amanhã.</h2>
          <p className="mt-2 text-xs leading-5 text-white/60">Aulas curtas, frameworks e exemplos reais para sair com um próximo passo claro.</p>
        </div>
      </section>

      <div className="mt-6 flex items-center justify-between border-b border-[#E3E3DF] pb-3">
        <p className="text-[11px] font-extrabold text-[#34332F]">Todas as trilhas</p>
        <p className="text-[9px] font-bold text-[#92908A]">{courses.length} disponíveis</p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map(course => {
          const lessons = course.community_modules.flatMap(module => module.community_lessons ?? [])
          const totalMinutes = lessons.reduce((total, lesson) => total + lesson.duration_minutes, 0)
          return (
            <Link key={course.id} href={`/community/classroom/${course.slug}`} className="group flex min-h-[19rem] flex-col overflow-hidden rounded-xl border border-[#E1E1DD] bg-white transition hover:-translate-y-0.5 hover:border-[#CBCAC5] hover:shadow-md">
              <div className={`relative flex h-28 items-center justify-center overflow-hidden bg-gradient-to-br ${accentStyles[course.accent] ?? accentStyles.orange}`}>
                <div className="absolute h-32 w-32 rounded-full border-[24px] border-white/35" />
                <span className="relative text-5xl transition-transform group-hover:scale-110">{course.emoji}</span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <span className="text-[8px] font-black uppercase tracking-[0.14em] text-[#D9470F]">{course.level_label}</span>
                <h2 className="mt-2 text-base font-extrabold leading-5 tracking-[-0.015em] text-[#292824]">{course.title}</h2>
                <p className="mt-2 line-clamp-3 flex-1 text-[11px] leading-5 text-[#77746E]">{course.description}</p>
                <div className="mt-4 flex items-center gap-3 border-t border-[#ECECE8] pt-3 text-[9px] font-bold text-[#92908A]">
                  <span className="flex items-center gap-1"><Layers3 className="h-3.5 w-3.5" /> {lessons.length} aulas</span>
                  <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {totalMinutes} min</span>
                  <ArrowRight className="ml-auto h-3.5 w-3.5 text-[#D9470F] transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {courses.length === 0 ? <div className="mt-5 rounded-xl border border-dashed border-[#D9D8D3] bg-white/60 p-10 text-center text-xs text-[#77746E]">As primeiras trilhas estão sendo preparadas.</div> : null}
    </div>
  )
}
