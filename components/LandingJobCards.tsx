'use client'

type Locale = 'pt' | 'en'

interface MockJob {
  title: string
  company: string
  remote: { label: string; color: string }
  salary: string
}

const jobs: Record<Locale, MockJob[]> = {
  pt: [
    {
      title: 'Legal Operations Manager',
      company: 'Stripe',
      remote: { label: '100% Remoto', color: 'bg-green-100 text-green-800' },
      salary: 'USD 130k – 160k',
    },
    {
      title: 'CLM Implementation Lead',
      company: 'Notion',
      remote: { label: 'Remoto + Viagem', color: 'bg-blue-100 text-blue-800' },
      salary: 'USD 115k – 145k',
    },
    {
      title: 'Contract Operations Analyst',
      company: 'Figma',
      remote: { label: '100% Remoto', color: 'bg-green-100 text-green-800' },
      salary: 'USD 95k – 120k',
    },
  ],
  en: [
    {
      title: 'Legal Operations Manager',
      company: 'Stripe',
      remote: { label: '100% Remote', color: 'bg-green-100 text-green-800' },
      salary: 'USD 130k – 160k',
    },
    {
      title: 'CLM Implementation Lead',
      company: 'Notion',
      remote: { label: 'Remote + Travel', color: 'bg-blue-100 text-blue-800' },
      salary: 'USD 115k – 145k',
    },
    {
      title: 'Contract Operations Analyst',
      company: 'Figma',
      remote: { label: '100% Remote', color: 'bg-green-100 text-green-800' },
      salary: 'USD 95k – 120k',
    },
  ],
}

export function LandingJobCards({ locale }: { locale: Locale }) {
  const items = jobs[locale]

  return (
    <div className="animate-subtle-float">
      <div className="rounded-[28px] border border-stone-200 bg-white p-4 shadow-lg">
        {/* Browser-style top bar */}
        <div className="mb-4 flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
        </div>

        {/* Job cards grid */}
        <div className="grid grid-cols-2 gap-3">
          {items.map((job, i) => (
            <div
              key={job.company}
              className={`animate-fade-slide-up rounded-xl border border-slate-200 p-3 ${
                i === 2 ? 'col-span-2 sm:col-span-1' : ''
              }`}
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <p className="text-xs font-semibold text-slate-900 truncate">
                {job.title}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">{job.company}</p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${job.remote.color}`}
                >
                  {job.remote.label}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">{job.salary}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
