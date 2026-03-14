'use client'

type Locale = 'pt' | 'en'

interface MockCard {
  title: string
  company: string
  highlight?: boolean
}

interface Column {
  label: string
  count: number
  cards: MockCard[]
}

const columns: Record<Locale, Column[]> = {
  pt: [
    {
      label: 'Pesquisando',
      count: 2,
      cards: [
        { title: 'Legal Ops Mgr', company: 'Stripe' },
        { title: 'CLM Lead', company: 'Notion' },
      ],
    },
    {
      label: 'Aplicada',
      count: 1,
      cards: [{ title: 'Contract Ops', company: 'Figma', highlight: true }],
    },
    {
      label: 'Entrevista',
      count: 1,
      cards: [{ title: 'Legal Tech PM', company: 'Airtable' }],
    },
    { label: 'Oferta', count: 0, cards: [] },
    { label: 'Descartada', count: 0, cards: [] },
  ],
  en: [
    {
      label: 'Researching',
      count: 2,
      cards: [
        { title: 'Legal Ops Mgr', company: 'Stripe' },
        { title: 'CLM Lead', company: 'Notion' },
      ],
    },
    {
      label: 'Applied',
      count: 1,
      cards: [{ title: 'Contract Ops', company: 'Figma', highlight: true }],
    },
    {
      label: 'Interview',
      count: 1,
      cards: [{ title: 'Legal Tech PM', company: 'Airtable' }],
    },
    { label: 'Offer', count: 0, cards: [] },
    { label: 'Discarded', count: 0, cards: [] },
  ],
}

export function LandingPipeline({ locale }: { locale: Locale }) {
  const cols = columns[locale]

  return (
    <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-stone-50 p-5">
      <div className="flex gap-3 overflow-x-auto pb-2">
        {cols.map((col, colIdx) => (
          <div
            key={col.label}
            className="animate-fade-slide-up min-w-[140px] flex-1 rounded-xl bg-white/70 p-2"
            style={{ animationDelay: `${colIdx * 0.1}s` }}
          >
            {/* Column header */}
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                {col.label}
              </span>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[10px] font-medium text-slate-600">
                {col.count}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2">
              {col.cards.map(card => (
                <div
                  key={`${card.company}-${card.title}`}
                  className={`rounded-lg border bg-white p-2 ${
                    card.highlight
                      ? 'animate-pulse-glow border-blue-300'
                      : 'border-slate-200'
                  }`}
                >
                  <p className="text-[10px] font-medium text-slate-900 truncate">
                    {card.title}
                  </p>
                  <p className="text-[10px] text-slate-400">{card.company}</p>
                </div>
              ))}

              {col.cards.length === 0 && (
                <div className="py-4 text-center text-[10px] text-slate-300">—</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
