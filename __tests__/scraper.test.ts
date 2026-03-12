import { describe, it, expect } from 'vitest'
import { filterByKeywords, parseGreenhouseJobs, parseLeverJobs } from '@/lib/scraper'

describe('filterByKeywords', () => {
  it('keeps jobs with matching title', () => {
    const jobs = [
      { title: 'Legal Operations Manager', url: 'https://a.com' },
      { title: 'Software Engineer', url: 'https://b.com' },
      { title: 'Head of Legal Ops', url: 'https://c.com' },
    ]
    const result = filterByKeywords(jobs)
    expect(result).toHaveLength(2)
    expect(result[0].title).toBe('Legal Operations Manager')
    expect(result[1].title).toBe('Head of Legal Ops')
  })

  it('returns empty array when nothing matches', () => {
    expect(filterByKeywords([{ title: 'Cook', url: 'https://x.com' }])).toHaveLength(0)
  })
})

describe('parseGreenhouseJobs', () => {
  it('parses greenhouse API response', () => {
    const raw = {
      jobs: [
        { title: 'Legal Operations Manager', absolute_url: 'https://boards.greenhouse.io/acme/jobs/123' },
        { title: 'Data Engineer', absolute_url: 'https://boards.greenhouse.io/acme/jobs/456' },
      ]
    }
    const result = parseGreenhouseJobs(raw, 'acme')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      title: 'Legal Operations Manager',
      url: 'https://boards.greenhouse.io/acme/jobs/123',
      source_board: 'greenhouse',
      company: 'acme',
    })
  })
})

describe('parseLeverJobs', () => {
  it('parses lever API response', () => {
    const raw = [
      { text: 'Legal Ops Specialist', hostedUrl: 'https://jobs.lever.co/stone/abc' },
      { text: 'Marketing', hostedUrl: 'https://jobs.lever.co/stone/def' },
    ]
    const result = parseLeverJobs(raw, 'stone')
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Legal Ops Specialist')
    expect(result[0].source_board).toBe('lever')
  })
})
