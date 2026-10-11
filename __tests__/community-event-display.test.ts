import { expect, it } from 'vitest'
import { upcomingCommunityEvents } from '@/lib/community-event-display'

it('orders confirmed future dates before pending dates and excludes completed meetings', () => {
  const events = [
    { starts_at: '2025-01-01', location_label: 'Data a confirmar', id: 'pending' },
    { starts_at: '2026-10-14', location_label: 'Remoto', id: 'soon' },
    { starts_at: '2026-09-17', location_label: 'São Paulo', id: 'past' },
    { starts_at: '2026-11-01', location_label: 'Remoto', id: 'later' },
  ]
  expect(upcomingCommunityEvents(events, Date.parse('2026-10-09')).map(event => event.id)).toEqual(['soon', 'later', 'pending'])
})
