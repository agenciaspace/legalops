// __tests__/types.test.ts
import { describe, it, expect } from 'vitest'
import type { Job, PipelineEntry, Leader, JobNote } from '@/lib/types'

describe('types', () => {
  it('Job has required fields', () => {
    const job: Job = {
      id: 'uuid',
      title: 'Legal Ops Manager',
      company: 'Acme',
      url: 'https://example.com',
      source_board: 'greenhouse',
      salary_min: null,
      salary_max: null,
      salary_currency: null,
      benefits: [],
      remote_label: null,
      remote_reality: 'unknown',
      remote_notes: null,
      enrichment_status: 'pending',
      enrichment_attempts: 0,
      posted_at: null,
      raw_description: '',
      suggested_leader_name: null,
      suggested_leader_title: null,
      suggested_leader_linkedin: null,
      created_at: new Date().toISOString(),
    }
    expect(job.id).toBe('uuid')
  })

  it('PipelineEntry has required fields', () => {
    const entry: PipelineEntry = {
      id: 'entry-uuid',
      user_id: 'user-uuid',
      job_id: 'job-uuid',
      status: 'researching',
      created_at: new Date().toISOString(),
    }
    expect(entry.status).toBe('researching')
  })

  it('Leader has required fields', () => {
    const leader: Leader = {
      id: 'leader-uuid',
      entry_id: 'entry-uuid',
      user_id: 'user-uuid',
      name: 'Ana Lima',
      title: 'Head of Legal Ops',
      linkedin_url: 'https://linkedin.com/in/analima',
      confirmed: false,
      notes: null,
      created_at: new Date().toISOString(),
    }
    expect(leader.confirmed).toBe(false)
  })

  it('JobNote has required fields', () => {
    const note: JobNote = {
      id: 'note-uuid',
      entry_id: 'entry-uuid',
      user_id: 'user-uuid',
      content: 'Interesting role',
      created_at: new Date().toISOString(),
    }
    expect(note.content).toBe('Interesting role')
  })
})
