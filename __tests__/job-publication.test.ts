import { describe, expect, it } from 'vitest'
import {
  extractDirectApplicationLinks,
  isBlockedJobSourceUrl,
  isDirectJobUrl,
  isPublishableJobRecord,
  isSafePublicHttpUrl,
} from '@/lib/job-publication'

describe('job publication policy', () => {
  it('treats social networks and aggregators only as discovery sources', () => {
    expect(isBlockedJobSourceUrl('https://www.linkedin.com/jobs/view/123456')).toBe(true)
    expect(isBlockedJobSourceUrl('https://br.indeed.com/viewjob?jk=abc')).toBe(true)
    expect(isBlockedJobSourceUrl('https://vaga-ja.com/job/123')).toBe(true)
    expect(isDirectJobUrl('https://job-boards.greenhouse.io/acme/jobs/123')).toBe(true)
    expect(isDirectJobUrl('https://acme.com/careers/legal-ops')).toBe(true)
  })

  it('rejects local and private destinations', () => {
    expect(isSafePublicHttpUrl('http://localhost:3000/jobs/1')).toBe(false)
    expect(isSafePublicHttpUrl('http://127.0.0.1/admin')).toBe(false)
    expect(isSafePublicHttpUrl('http://192.168.1.20/jobs')).toBe(false)
    expect(isSafePublicHttpUrl('https://jobs.example.com/role')).toBe(true)
  })

  it('extracts only direct application links from a discovery page', () => {
    const html = `
      <a href="https://www.linkedin.com/jobs/view/123456">Ver no LinkedIn</a>
      <a href="https://jobs.lever.co/acme/legal-ops">Candidatar-se</a>
    `
    expect(extractDirectApplicationLinks(html, 'https://vaga-ja.com/job/123')).toEqual([
      'https://jobs.lever.co/acme/legal-ops',
    ])
  })

  it('requires a verified direct URL and a logo before publication', () => {
    expect(isPublishableJobRecord({
      url: 'https://jobs.lever.co/acme/legal-ops',
      urlStatus: 'live',
      companyLogoUrl: 'https://acme.com/logo.svg',
    })).toBe(true)
    expect(isPublishableJobRecord({
      url: 'https://www.linkedin.com/jobs/view/123456',
      urlStatus: 'live',
      companyLogoUrl: 'https://acme.com/logo.svg',
    })).toBe(false)
    expect(isPublishableJobRecord({
      url: 'https://jobs.lever.co/acme/legal-ops',
      urlStatus: 'live',
      companyLogoUrl: null,
    })).toBe(false)
  })
})
