export type PublicEvent = {
  id: string
  slug: string
  title: string
  description: string
  host_name: string
  starts_at: string
  ends_at: string | null
  location_label: string
  event_type: string
  is_published: boolean
  participation_mode: 'remoto' | 'presencial' | 'hibrido'
  participation_details: string
  pre_questions: string[] | null
}

const events: Record<string, PublicEvent> = {
  'bench-honorarios-exito-2026': {
    id: '',
    slug: 'bench-honorarios-exito-2026',
    title: 'Bench: provisionamento de honorários de êxito',
    description: 'Encontro entre profissionais de departamentos jurídicos, escritórios e Legal Ops para comparar como diferentes times provisionam honorários de êxito — de escritórios fornecedores e da parte adversa. Vamos conversar sobre critérios, modelos de cálculo, políticas internas e uso de sistemas.',
    host_name: 'Alexander Pibernat',
    starts_at: '2026-10-01T15:00:00.000Z',
    ends_at: null,
    location_label: 'Remoto — data a confirmar',
    event_type: 'encontro',
    is_published: true,
    participation_mode: 'remoto',
    participation_details: 'Encontro remoto, com data e horário a confirmar. Cadastre-se para receber os detalhes quando forem definidos.',
    pre_questions: [
      'Como departamentos jurídicos e escritórios provisionam honorários de êxito hoje?',
      'Como vocês provisionam honorários de êxito dos escritórios fornecedores?',
      'A provisão de honorários da parte adversa entra no mesmo fluxo?',
      'O cálculo é caso a caso, segue uma política interna ou usa dados e sistemas?',
    ],
  },
}

export function getPublicEventFallback(slug: string) {
  return events[slug] ?? null
}
