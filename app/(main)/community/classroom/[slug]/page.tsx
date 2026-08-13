import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Clock3, PlayCircle } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'

type Lesson = {
  id: string
  title: string
  summary: string | null
  duration_minutes: number
  sort_order: number
}

type Module = {
  id: string
  title: string
  description: string | null
  sort_order: number
  community_lessons: Lesson[]
}

type Course = {
  id: string
  title: string
  description: string
  emoji: string
  level_label: string
  community_modules: Module[]
}

export const dynamic = 'force-dynamic'

export default async function CoursePage({ params }: { params: { slug: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: rawCourse } = await supabase
    .from('community_courses')
    .select('id, title, description, emoji, level_label, community_modules(id, title, description, sort_order, community_lessons(id, title, summary, duration_minutes, sort_order))')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .maybeSingle()

  if (!rawCourse) notFound()
  const course = rawCourse as Course
  const modules = [...(course.community_modules ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  const lessons = modules.flatMap(module => module.community_lessons ?? [])
  const totalMinutes = lessons.reduce((total, lesson) => total + lesson.duration_minutes, 0)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
      <Link href="/community/classroom" className="inline-flex items-center gap-2 text-xs font-black text-[#1A1A1A]/50 transition hover:text-[#1A1A1A]">
        <ArrowLeft className="h-4 w-4" /> Voltar às trilhas
      </Link>

      <section className="mt-6 overflow-hidden rounded-3xl bg-[#1A1A1A] text-white shadow-xl">
        <div className="grid items-center gap-8 px-6 py-9 sm:px-10 lg:grid-cols-[1fr_13rem]">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#FF7A45]">{course.level_label}</span>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">{course.title}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">{course.description}</p>
            <div className="mt-6 flex flex-wrap gap-4 text-xs font-bold text-white/50">
              <span className="flex items-center gap-1.5"><PlayCircle className="h-4 w-4" /> {lessons.length} aulas</span>
              <span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4" /> {totalMinutes} minutos</span>
            </div>
          </div>
          <div className="hidden h-44 items-center justify-center rounded-3xl bg-white/8 text-7xl lg:flex">{course.emoji}</div>
        </div>
      </section>

      <div className="mt-7 space-y-4">
        {modules.map((module, moduleIndex) => {
          const moduleLessons = [...(module.community_lessons ?? [])].sort((a, b) => a.sort_order - b.sort_order)
          return (
            <section key={module.id} className="overflow-hidden rounded-2xl border border-[#1A1A1A]/10 bg-white shadow-sm">
              <div className="border-b border-[#1A1A1A]/8 bg-[#FAF9F6] px-5 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#FF6A00]">Módulo {moduleIndex + 1}</p>
                <h3 className="mt-1 text-base font-black">{module.title.replace(/^\d+\.\s*/, '')}</h3>
                {module.description ? <p className="mt-1 text-xs text-[#1A1A1A]/50">{module.description}</p> : null}
              </div>
              <div className="divide-y divide-[#1A1A1A]/8">
                {moduleLessons.map((lesson, lessonIndex) => (
                  <details key={lesson.id} className="group px-5 py-4">
                    <summary className="flex cursor-pointer list-none items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-[11px] font-black text-[#1A1A1A]/55 group-open:bg-[#FF6A00] group-open:text-white">
                        {lessonIndex + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-black">{lesson.title}</h4>
                        <span className="mt-1 flex items-center gap-1 text-[10px] font-bold text-[#1A1A1A]/40"><Clock3 className="h-3 w-3" /> {lesson.duration_minutes} min</span>
                      </div>
                      <PlayCircle className="h-5 w-5 text-[#1A1A1A]/25 group-open:text-[#FF6A00]" />
                    </summary>
                    <div className="ml-11 mt-3 rounded-xl bg-[#F5F4F0] p-4 text-sm leading-6 text-[#1A1A1A]/65">
                      <p>{lesson.summary}</p>
                      <div className="mt-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Resumo da aula</div>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
