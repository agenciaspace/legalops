import Link from 'next/link'
import { ArrowRight, BookOpen, Clock3, Layers3 } from 'lucide-react'
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
  orange: 'from-orange-100 to-orange-50 text-orange-900',
  violet: 'from-violet-100 to-violet-50 text-violet-900',
  emerald: 'from-emerald-100 to-emerald-50 text-emerald-900',
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="max-w-2xl">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#FF6A00]">
          <BookOpen className="h-4 w-4" /> Trilhas do Club
        </div>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Aprenda hoje. Aplique amanhã.</h2>
        <p className="mt-3 text-sm leading-6 text-[#1A1A1A]/55">Conteúdo direto ao ponto para estruturar, implementar e medir iniciativas de Legal Operations.</p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {courses.map(course => {
          const lessons = course.community_modules.flatMap(module => module.community_lessons ?? [])
          const totalMinutes = lessons.reduce((total, lesson) => total + lesson.duration_minutes, 0)
          return (
            <Link
              key={course.id}
              href={`/community/classroom/${course.slug}`}
              className="group flex min-h-[22rem] flex-col overflow-hidden rounded-2xl border border-[#1A1A1A]/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className={`flex h-36 items-center justify-center bg-gradient-to-br ${accentStyles[course.accent] ?? accentStyles.orange}`}>
                <span className="text-6xl transition-transform group-hover:scale-110">{course.emoji}</span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#FF6A00]">{course.level_label}</span>
                <h3 className="mt-2 text-xl font-black tracking-[-0.025em]">{course.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-[#1A1A1A]/55">{course.description}</p>
                <div className="mt-5 flex items-center gap-4 border-t border-[#1A1A1A]/8 pt-4 text-[11px] font-bold text-[#1A1A1A]/45">
                  <span className="flex items-center gap-1.5"><Layers3 className="h-3.5 w-3.5" /> {lessons.length} aulas</span>
                  <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> {totalMinutes} min</span>
                  <ArrowRight className="ml-auto h-4 w-4 text-[#1A1A1A] transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {courses.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[#1A1A1A]/15 bg-white/60 p-10 text-center text-sm text-[#1A1A1A]/50">As primeiras trilhas estão sendo preparadas.</div>
      ) : null}
    </div>
  )
}
