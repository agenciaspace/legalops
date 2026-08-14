import { describe, expect, it } from 'vitest'
import {
  buildFirecrawlAgentPrompt,
  buildJobDiscoverySeed,
  canonicalizeJobUrl,
  extractFirecrawlJobsFromPayload,
  filterByKeywords,
  inferSourceBoardFromUrl,
  mapWithConcurrency,
  matchesLegalOpsTitle,
  matchesTargetMarket,
  normalizeFirecrawlJobListing,
  parseGreenhouseJobs,
  parseLeverJobs,
  shouldExpireUnseenJob,
} from '@/lib/scraper'

describe('matchesLegalOpsTitle', () => {
  it('matches titles with Legal Operations or Legal Ops', () => {
    expect(matchesLegalOpsTitle('Legal Operations Manager')).toBe(true)
    expect(matchesLegalOpsTitle('Head of Legal Ops')).toBe(true)
    expect(matchesLegalOpsTitle('Senior Counsel')).toBe(false)
  })

  it('matches broader legal operations titles', () => {
    expect(matchesLegalOpsTitle('Contracts & Legal Operations Manager')).toBe(true)
    expect(matchesLegalOpsTitle('Legal Project & Operations Manager')).toBe(true)
    expect(matchesLegalOpsTitle('Manager, Law Department Strategy & Operations')).toBe(true)
    expect(matchesLegalOpsTitle('Operations Manager, Legal')).toBe(true)
    expect(matchesLegalOpsTitle('CLM Manager')).toBe(true)
    expect(matchesLegalOpsTitle('Head of Legal')).toBe(false)
    expect(matchesLegalOpsTitle('General Counsel')).toBe(false)
    expect(matchesLegalOpsTitle('Chief Legal Officer')).toBe(false)
    expect(matchesLegalOpsTitle('Software Engineer')).toBe(false)
    expect(matchesLegalOpsTitle('Marketing Operations Manager')).toBe(false)
  })

  it('matches Brazilian Legal Ops titles with and without accents', () => {
    expect(matchesLegalOpsTitle('Analista de Operações Jurídicas Sênior')).toBe(true)
    expect(matchesLegalOpsTitle('Coordenador(a) de Controladoria Jurídica')).toBe(true)
    expect(matchesLegalOpsTitle('Especialista em Inovação Jurídica')).toBe(true)
    expect(matchesLegalOpsTitle('Operador de Legal Ops Pleno')).toBe(true)
    expect(matchesLegalOpsTitle('Advogado(a) Trabalhista Sênior')).toBe(false)
  })
})

describe('filterByKeywords', () => {
  it('keeps jobs with legal operations related titles', () => {
    const jobs = [
      { title: 'Legal Operations Manager', url: 'https://a.com' },
      { title: 'Software Engineer', url: 'https://b.com' },
      { title: 'Head of Legal Ops', url: 'https://c.com' },
      { title: 'Head of Legal', url: 'https://d.com' },
      { title: 'Marketing Coordinator', url: 'https://e.com' },
    ]

    const result = filterByKeywords(jobs)

    expect(result).toHaveLength(2)
    expect(result[0].title).toBe('Legal Operations Manager')
    expect(result[1].title).toBe('Head of Legal Ops')
  })
})

describe('buildFirecrawlAgentPrompt', () => {
  it('anchors discovery to Brazil and a recent publication window', () => {
    const prompt = buildFirecrawlAgentPrompt(new Date('2026-08-14T12:00:00Z'))

    expect(prompt).toContain('Today is 2026-08-14')
    expect(prompt).toContain('last 30 days')
    expect(prompt).toContain('Roles in Brazil')
    expect(prompt).toContain('operações jurídicas')
    expect(prompt).toContain('Exclude generic lawyer')
  })
})

describe('matchesTargetMarket', () => {
  it('keeps Brazil and LATAM locations while rejecting restricted foreign roles', () => {
    expect(matchesTargetMarket('Brazil (Remote)')).toBe(true)
    expect(matchesTargetMarket('São Paulo, SP')).toBe(true)
    expect(matchesTargetMarket('Latin America')).toBe(true)
    expect(matchesTargetMarket('Bengaluru')).toBe(false)
    expect(matchesTargetMarket('Remote - US only')).toBe(false)
    expect(matchesTargetMarket(null)).toBe(false)
  })
})

describe('canonicalizeJobUrl', () => {
  it('removes tracking while preserving job-identifying query parameters', () => {
    expect(canonicalizeJobUrl(
      'https://Example.com/jobs/123/?utm_source=linkedin&gh_jid=123&source=club#apply',
    )).toBe('https://example.com/jobs/123?gh_jid=123')

    expect(canonicalizeJobUrl(
      'https://br.indeed.com/viewjob?utm_campaign=jobs&jk=abc123',
    )).toBe('https://br.indeed.com/viewjob?jk=abc123')
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
          postedDate: '2026-08-12',
          acceptsBrazilCandidates: true,
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
          acceptsBrazilCandidates: true,
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
          acceptsBrazilCandidates: true,
          applicationLink: 'https://www.brex.com/careers/8371093002?gh_jid=8371093002&source=GoInhouse.com',
          applicationLink_citation: 'https://www.goinhouse.com/jobs/500449284-head-of-legal-operations-at-brex',
        },
        {
          jobTitle: 'Legal Operations Manager',
          companyName: 'US Only Co',
          location: 'New York, NY',
          acceptsBrazilCandidates: false,
          applicationLink: 'https://example.com/jobs/us-only',
        },
      ],
    }

    const result = extractFirecrawlJobsFromPayload(payload)

    expect(result).toHaveLength(3)
    expect(result[0]).toMatchObject({
      title: 'Legal Operations Billing, Manager',
      company: 'Mondelez International, Inc',
      source_board: 'cloc',
      location: 'Chicago, Illinois',
      salary_range: '$95,100 to $130,790 per year',
      posted_at: '2026-08-12T00:00:00.000Z',
    })
    expect(result[1]).toMatchObject({
      title: 'Operations Manager, Legal',
      company: 'Cohere',
      source_board: 'legaloperators',
    })
    expect(result[2]).toMatchObject({
      title: 'Head of Legal Operations',
      company: 'Brex',
      source_board: 'goinhouse',
      location: 'San Francisco, CA',
    })
  })
})

describe('normalizeFirecrawlJobListing salary cleaning', () => {
  it('strips "Not specified" and similar non-salary values', () => {
    const base = {
      jobTitle: 'Legal Operations Manager',
      companyName: 'Acme',
      applicationLink: 'https://example.com/apply',
    }

    expect(normalizeFirecrawlJobListing({ ...base, salaryRange: 'Not specified' })?.salary_range).toBeNull()
    expect(normalizeFirecrawlJobListing({ ...base, salaryRange: 'Not listed' })?.salary_range).toBeNull()
    expect(normalizeFirecrawlJobListing({ ...base, salaryRange: 'N/A' })?.salary_range).toBeNull()
    expect(normalizeFirecrawlJobListing({ ...base, salaryRange: 'Full-time' })?.salary_range).toBeNull()
    expect(normalizeFirecrawlJobListing({ ...base, salaryRange: 'Pay information not provided' })?.salary_range).toBeNull()
  })

  it('keeps real salary values', () => {
    const base = {
      jobTitle: 'Legal Operations Manager',
      companyName: 'Acme',
      applicationLink: 'https://example.com/apply',
    }

    expect(normalizeFirecrawlJobListing({ ...base, salaryRange: '$120,000 - $180,000 a year' })?.salary_range).toBe('$120,000 - $180,000 a year')
    expect(normalizeFirecrawlJobListing({ ...base, salaryRange: '$195,000 to $250,000 Annually' })?.salary_range).toBe('$195,000 to $250,000 Annually')
  })
})

describe('extractFirecrawlJobsFromPayload (scrape format)', () => {
  it('handles the /v1/scrape extract format', () => {
    const payload = {
      jobListings: [
        {
          jobTitle: 'Legal Operations Assistant',
          companyName: 'Deckers Brands',
          location: 'Goleta, CA',
          salaryRange: '$27 - $29 an hour',
          acceptsBrazilCandidates: true,
          applicationLink: 'https://www.indeed.com/viewjob?jk=abc123',
        },
        {
          jobTitle: 'Head of Legal Operations',
          companyName: 'NGEN',
          location: 'Remote',
          salaryRange: '$210,000 to $250,000 Annually',
          acceptsBrazilCandidates: true,
          applicationLink: 'https://www.goinhouse.com/jobs/123',
        },
        {
          jobTitle: 'Software Engineer',
          companyName: 'Google',
          location: 'Mountain View, CA',
          salaryRange: '$200,000 a year',
          applicationLink: 'https://google.com/careers/123',
        },
      ],
    }

    const result = extractFirecrawlJobsFromPayload(payload)

    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({
      title: 'Legal Operations Assistant',
      salary_range: '$27 - $29 an hour',
      source_board: 'indeed',
    })
    expect(result[1]).toMatchObject({
      title: 'Head of Legal Operations',
      salary_range: '$210,000 to $250,000 Annually',
      source_board: 'goinhouse',
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

describe('shouldExpireUnseenJob', () => {
  const oldJob = {
    url: 'https://example.com/jobs/old?utm_source=linkedin',
    created_at: '2026-03-12T00:00:00Z',
    posted_at: null,
    url_checked_at: null,
  }

  it('expires an old job that the successful inventory no longer sees', () => {
    expect(shouldExpireUnseenJob(
      oldJob,
      new Set(),
      new Date('2026-08-14T00:00:00Z'),
    )).toBe(true)
  })

  it('keeps old rows when their canonical URL was rediscovered', () => {
    expect(shouldExpireUnseenJob(
      oldJob,
      new Set(['https://example.com/jobs/old']),
      new Date('2026-08-14T00:00:00Z'),
    )).toBe(false)
  })

  it('keeps unseen jobs with a recent publication signal', () => {
    expect(shouldExpireUnseenJob(
      { ...oldJob, posted_at: '2026-08-10T00:00:00Z' },
      new Set(),
      new Date('2026-08-14T00:00:00Z'),
    )).toBe(false)
  })
})

describe('mapWithConcurrency', () => {
  it('processes all items without exceeding the limit', async () => {
    let active = 0
    let maxActive = 0

    const results = await mapWithConcurrency([1, 2, 3, 4, 5, 6], 3, async value => {
      active++
      maxActive = Math.max(maxActive, active)
      await new Promise(resolve => setTimeout(resolve, 5))
      active--
      return value * 2
    })

    expect(maxActive).toBeLessThanOrEqual(3)
    expect(results.map(result => result.status === 'fulfilled' ? result.value : null))
      .toEqual([2, 4, 6, 8, 10, 12])
  })
})
