import type { NewsTopic } from '@/lib/news'

const coverNames: Record<NewsTopic, string> = {
  'ia-tecnologia': 'inteligência em movimento',
  'operacoes-contratos': 'o trabalho por dentro',
  'negocios-mercado': 'um mercado em mudança',
  'pessoas-competencias': 'as pessoas fazem o próximo',
  governanca: 'as regras do jogo',
}

export function NewsCover({ topic, seed = '', large = false }: { topic: NewsTopic; seed?: string; large?: boolean }) {
  const variant = Array.from(seed).reduce((sum, character) => sum + character.charCodeAt(0), 0) % 4
  return <div className={`news-cover news-cover-${variant}${large ? ' news-cover-large' : ''}`} aria-hidden="true">
    <span className="news-cover-caption">{coverNames[topic]}</span>
    <svg className="news-cover-art" viewBox="0 0 600 340" fill="none">
      {variant === 0 ? <>
        <circle cx="310" cy="180" r="112" stroke="currentColor" strokeWidth="1.5"/>
        <ellipse cx="310" cy="180" rx="56" ry="145" stroke="currentColor" strokeWidth="1.5" transform="rotate(40 310 180)"/>
        <ellipse cx="310" cy="180" rx="56" ry="145" stroke="currentColor" strokeWidth="1.5" transform="rotate(-40 310 180)"/>
        <circle cx="310" cy="180" r="23" fill="currentColor"/><circle cx="220" cy="100" r="9" fill="currentColor"/>
        <path d="M90 180H152M468 180H530M310 24V45M310 315V336" stroke="currentColor"/>
      </> : variant === 1 ? <>
        <rect x="159" y="71" width="148" height="204" rx="4" stroke="currentColor" strokeWidth="2" transform="rotate(-12 159 71)"/>
        <rect x="255" y="80" width="148" height="204" rx="4" fill="var(--lo-cream)" stroke="currentColor" strokeWidth="2" transform="rotate(11 255 80)"/>
        <path d="m282 125 79 15m-85 19 94 18m-100 17 66 13m-73 20 91 18" stroke="currentColor" strokeWidth="3"/>
        <circle cx="400" cy="99" r="30" fill="var(--lo-coral)" stroke="currentColor" strokeWidth="2"/>
        <path d="m388 99 8 8 17-18" stroke="currentColor" strokeWidth="2"/>
      </> : variant === 2 ? <>
        <path d="M140 91H460M140 250H460M219 50V292M380 50V292" stroke="currentColor" strokeWidth="1"/>
        <circle cx="219" cy="91" r="36" fill="currentColor"/>
        <circle cx="380" cy="91" r="36" stroke="currentColor" strokeWidth="2"/>
        <circle cx="219" cy="250" r="36" stroke="currentColor" strokeWidth="2"/>
        <circle cx="380" cy="250" r="36" fill="currentColor"/>
        <path d="m255 91 89 159m-89 0 89-159" stroke="currentColor" strokeWidth="2"/>
        <circle cx="300" cy="170" r="14" fill="var(--lo-coral)"/>
      </> : <>
        <path d="M138 271V70H220V271M260 271V116H342V271M382 271V162H464V271" stroke="currentColor" strokeWidth="2"/>
        <path d="M118 292H484M138 49H220M260 94H342M382 140H464" stroke="currentColor"/>
        <path d="m163 179 52-38 83 30 126-94m-35-1h36v36" stroke="currentColor" strokeWidth="4"/>
        <circle cx="299" cy="171" r="12" fill="var(--lo-coral)" stroke="currentColor" strokeWidth="2"/>
      </>}
    </svg>
    <span className="news-cover-imprint">legalops<span>.</span>news / leitura de cenário</span>
    <span className="news-cover-mark">↗</span>
  </div>
}
