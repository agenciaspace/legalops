import { describe, expect, it } from 'vitest'
import {
  buildJobDiscoverySeed,
  extractFirecrawlJobsFromPayload,
  filterByKeywords,
  inferSourceBoardFromUrl,
  matchesLegalOpsTitle,
  parseGreenhouseJobs,
  parseLeverJobs,
} from '@/lib/scraper'

describe('matchesLegalOpsTitle', () => {
  it('keeps only titles that explicitly include Legal Operations or Legal Ops', () => {
    expect(matchesLegalOpsTitle('Legal Operations Manager')).toBe(true)
    expect(matchesLegalOpsTitle('Head of Legal Ops')).toBe(true)
    expect(matchesLegalOpsTitle('Operations Manager, Legal')).toBe(false)
    expect(matchesLegalOpsTitle('Senior Counsel')).toBe(false)
  })
})

describe('filterByKeywords', () => {
  it('keeps jobs with explicit legal operations titles', () => {
    const jobs = [
      { title: 'Legal Operations Manager', url: 'https://a.com' },
      { title: 'Software Engineer', url: 'https://b.com' },
      { title: 'Head of Legal Ops', url: 'https://c.com' },
      { title: 'Operations Manager, Legal', url: 'https://d.com' },
    ]

    const result = filterByKeywords(jobs)

    expect(result).toHaveLength(2)
    expect(result[0].title).toBe('Legal Operations Manager')
    expect(result[1].title).toBe('Head of Legal Ops')
  })
})

describe('inferSourceBoardFromUrl', () => {
  it('infers firecrawl-discovered sources from listing URLs', () => {
    expect(inferSourceBoardFromUrl('https://jobs.cloc.org/job/legal-operations-specialist')).toBe('cloc')
    expect(inferSourceBoardFromUrl('https://www.legal.io/jobs/5800549/Full-time/Senior-Legal-Operations-Manager')).toBe('legalio')
    expect(inferSourceBoardFromUrl('https://www.legaloperators.com/jobs/legal-operations-manager-hello-heart-bic')).toBe('legaloperators')
    expect(inferSourceBoardFromUrl('https://jobs.lever.co/company/123')).toBe('lever')
    expect(inferSourceBoardFromUrl('https://careers.example.com/open-role')).toBe('company_site')
  })
})

describe('extractFirecrawlJobsFromPayload', () => {
  it('normalizes the current Firecrawl response shape and excludes non-matching titles', () => {
    const payload = {
      jobListings: [
        {
          jobTitle: 'Legal Operations Billing, Manager',
          jobTitle_citation: 'https://jobs.cloc.org/job/legal-operations-billing-manager-chicago-illinois-0311',
          companyName: 'Mondelez International, Inc',
          companyName_citation: 'https://jobs.cloc.org/job/legal-operations-billing-manager-chicago-illinois-0311',
          location: 'Chicago, Illinois',
          location_citation: 'https://jobs.cloc.org/job/legal-operations-billing-manager-chicago-illinois-0311',
          salaryRange: '$95,100 to $130,790 per year',
          salaryRange_citation: 'https://jobs.cloc.org/job/legal-operations-billing-manager-chicago-illinois-0311',
          applicationLink: 'https://wd3.myworkdaysite.com/recruiting/mdlz/External/job/Global-Headquarters--Chicago-USA/Manager--Global-Legal-Financial-Operations_R-156257',
          applicationLink_citation: 'https://jobs.cloc.org/job/legal-operations-billing-manager-chicago-illinois-0311',
        },
        {
          jobTitle: 'Operations Manager, Legal',
          jobTitle_citation: 'https://www.legaloperators.com/jobs/operations-manager-legal-cohere-hn0',
          companyName: 'Cohere',
          companyName_citation: 'https://www.legaloperators.com/jobs/operations-manager-legal-cohere-hn0',
          location: 'San Francisco, CA',
          location_citation: 'https://www.legaloperators.com/jobs/operations-manager-legal-cohere-hn0',
          applicationLink: 'https://www.legaloperators.com/jobs/operations-manager-legal-cohere-hn0',
          applicationLink_citation: 'https://www.legaloperators.com/jobs/operations-manager-legal-cohere-hn0',
        },
        {
          jobTitle: 'Head of Legal Operations',
          jobTitle_citation: 'https://www.goinhouse.com/jobs/500449284-head-of-legal-operations-at-brex',
          companyName: 'Brex',
          companyName_citation: 'https://www.goinhouse.com/jobs/500449284-head-of-legal-operations-at-brex',
          location: 'San Francisco, CA',
          location_citation: 'https://www.goinhouse.com/jobs/500449284-head-of-legal-operations-at-brex',
          salaryRange: '$220,000 to $261,000 Annually',
          salaryRange_citation: 'https://www.goinhouse.com/jobs/500449284-head-of-legal-operations-at-brex',
          applicationLink: 'https://www.brex.com/careers/8371093002?gh_jid=8371093002&source=GoInhouse.com',
          applicationLink_citation: 'https://www.goinhouse.com/jobs/500449284-head-of-legal-operations-at-brex',
        },
      ],
    }

    const result = extractFirecrawlJobsFromPayload(payload)

    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({
      title: 'Legal Operations Billing, Manager',
      company: 'Mondelez International, Inc',
      source_board: 'cloc',
      location: 'Chicago, Illinois',
      salary_range: '$95,100 to $130,790 per year',
    })
    expect(result[1]).toMatchObject({
      title: 'Head of Legal Operations',
      company: 'Brex',
      source_board: 'goinhouse',
      location: 'San Francisco, CA',
    })
  })
})

describe('buildJobDiscoverySeed', () => {
  it('adds firecrawl metadata to the raw description seed', () => {
    const seed = buildJobDiscoverySeed({
      title: 'Legal Operations Analyst',
      company: 'Cloudflare',
      url: 'https://www.legal.io/jobs/5800339/Full-time/Legal-Operations-Analyst',
      source_board: 'legalio',
      location: 'California',
      salary_range: null,
      listing_url: 'https://www.legal.io/jobs/5800339/Full-time/Legal-Operations-Analyst',
    })

    expect(seed).toContain('Discovery source: legalio')
    expect(seed).toContain('Job title: Legal Operations Analyst')
    expect(seed).toContain('Company: Cloudflare')
    expect(seed).toContain('Location: California')
  })
})

describe('parseGreenhouseJobs', () => {
  it('parses greenhouse API response', () => {
    const raw = {
      jobs: [
        { title: 'Legal Operations Manager', absolute_url: 'https://boards.greenhouse.io/acme/jobs/123' },
        { title: 'Data Engineer', absolute_url: 'https://boards.greenhouse.io/acme/jobs/456' },
      ],
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
