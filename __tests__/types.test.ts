// __tests__/types.test.ts
import { describe, it, expect } from 'vitest'
import type { EmailMessage, EmailMessageWithAlias } from '@/lib/email-types'
import type {
  AccountProfile,
  ApplicationEvent,
  Contact,
  DashboardStats,
  EmailDomain,
  Job,
  JobNote,
  Leader,
  PipelineEntry,
  UserEmailAlias,
} from '@/lib/types'

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
      email_alias_id: null,
      status: 'researching',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      applied_at: null,
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

  it('Contact has required fields', () => {
    const contact: Contact = {
      id: 'contact-uuid',
      entry_id: 'entry-uuid',
      user_id: 'user-uuid',
      name: 'Ana Lima',
      role: 'Head of Legal Ops',
      email: 'ana@example.com',
      linkedin_url: 'https://linkedin.com/in/analima',
      phone: null,
      notes: null,
      created_at: new Date().toISOString(),
    }

    expect(contact.name).toBe('Ana Lima')
  })

  it('ApplicationEvent has required fields', () => {
    const event: ApplicationEvent = {
      id: 'event-uuid',
      entry_id: 'entry-uuid',
      user_id: 'user-uuid',
      event_type: 'follow_up',
      title: 'Sent follow-up',
      description: null,
      event_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }

    expect(event.event_type).toBe('follow_up')
  })

  it('DashboardStats has required fields', () => {
    const stats: DashboardStats = {
      total_tracked: 10,
      researching: 3,
      applied: 4,
      interview: 2,
      offer: 1,
      discarded: 0,
      applied_this_week: 2,
      interviews_this_week: 1,
      response_rate: 25,
    }

    expect(stats.total_tracked).toBe(10)
  })

  it('AccountProfile has required fields', () => {
    const profile: AccountProfile = {
      user_id: 'user-uuid',
      tier: 'free',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    expect(profile.tier).toBe('free')
  })

  it('EmailDomain has required fields', () => {
    const domain: EmailDomain = {
      id: 'domain-uuid',
      domain: 'reply.legalops.work',
      label: 'Brevo reply aliases',
      is_active: true,
      allow_random: true,
      allow_custom: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    expect(domain.domain).toContain('legalops')
  })

  it('UserEmailAlias has required fields', () => {
    const alias: UserEmailAlias = {
      id: 'alias-uuid',
      user_id: 'user-uuid',
      domain_id: 'domain-uuid',
      local_part: 'ana-lima',
      address: 'ana-lima@reply.legalops.work',
      source: 'custom',
      status: 'active',
      is_primary: true,
      provider: null,
      provider_alias_id: null,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    expect(alias.is_primary).toBe(true)
  })

  it('EmailMessage has required fields', () => {
    const message: EmailMessage = {
      id: 'message-uuid',
      user_id: 'user-uuid',
      alias_id: 'alias-uuid',
      provider: 'brevo',
      provider_message_id: 'provider-message',
      direction: 'inbound',
      status: 'received',
      from_name: 'Ana Lima',
      from_address: 'ana@example.com',
      reply_to_address: null,
      to_addresses: ['ana-lima@reply.legalops.work'],
      cc_addresses: [],
      bcc_addresses: [],
      subject: 'Hello there',
      text_body: 'Testing inbound message',
      html_body: null,
      error_message: null,
      headers: {},
      provider_payload: {},
      sent_at: null,
      received_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    expect(message.direction).toBe('inbound')
  })

  it('EmailMessageWithAlias has the alias relation', () => {
    const message: EmailMessageWithAlias = {
      id: 'message-uuid',
      user_id: 'user-uuid',
      alias_id: 'alias-uuid',
      provider: 'brevo',
      provider_message_id: null,
      direction: 'outbound',
      status: 'sent',
      from_name: 'Legal Ops',
      from_address: 'hello@mail.legalops.work',
      reply_to_address: 'ana-lima@reply.legalops.work',
      to_addresses: ['gc@example.com'],
      cc_addresses: [],
      bcc_addresses: [],
      subject: 'Follow-up',
      text_body: 'Quick follow-up',
      html_body: '<p>Quick follow-up</p>',
      error_message: null,
      headers: {},
      provider_payload: {},
      sent_at: new Date().toISOString(),
      received_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      alias: {
        id: 'alias-uuid',
        user_id: 'user-uuid',
        domain_id: 'domain-uuid',
        local_part: 'ana-lima',
        address: 'ana-lima@reply.legalops.work',
        source: 'custom',
        status: 'active',
        is_primary: true,
        provider: 'brevo',
        provider_alias_id: null,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    }

    expect(message.alias.address).toContain('reply.legalops.work')
  })
})
