import { describe, expect, it, vi } from 'vitest'
import {
  extractJobPostingsFromHtml,
  extractCompanyLogoFromHtml,
  parseAdzunaJobs,
  parseAshbyJobs,
  parseGupyPortalJobs,
  parseJoobleJobs,
  parseLinkedInJobCards,
  parseLinkedInJobsMarkdown,
  scrapeLinkedInJobs,
  scrapeJooble,
} from '@/lib/job-discovery'

describe('multi-source job discovery parsers', () => {
  it('extracts a company logo from JSON-LD, Open Graph or icons', () => {
    expect(extractCompanyLogoFromHtml(`
      <script type="application/ld+json">{"@type":"Organization","logo":{"url":"/brand/logo.png"}}</script>
    `, 'https://acme.example/jobs/1')).toBe('https://acme.example/brand/logo.png')

    expect(extractCompanyLogoFromHtml(`
      <meta property="og:image" content="https://cdn.example/acme.png">
    `, 'https://acme.example/jobs/1')).toBe('https://cdn.example/acme.png')

    expect(extractCompanyLogoFromHtml(`
      <link rel="icon" href="/favicon-192.png">
    `, 'https://acme.example/jobs/1')).toBe('https://acme.example/favicon-192.png')

    expect(extractCompanyLogoFromHtml(`
      <meta property="og:image" content="/social-preview.png">
      <link rel="icon" href="/favicon-192.png">
    `, 'https://acme.example/jobs/1')).toBe('https://acme.example/favicon-192.png')
  })
  it('parses a public LinkedIn card with its company logo and canonical job id', () => {
    const jobs = parseLinkedInJobCards(`
      <li>
        <div class="base-card" data-entity-urn="urn:li:jobPosting:4454450309">
          <a class="base-card__full-link" href="https://br.linkedin.com/jobs/view/legal-operations-manager-at-acme-4454450309?position=1&amp;pageNum=0"></a>
          <img alt="Acme" data-delayed-url="https://media.licdn.com/dms/image/company-logo_100_100/0/abc?e=2147483647&amp;v=beta&amp;t=signed">
          <h3 class="base-search-card__title"> Legal Operations Manager </h3>
          <h4 class="base-search-card__subtitle"> Acme </h4>
          <span class="job-search-card__location"> São Paulo, SP </span>
          <time datetime="2026-08-20"></time>
        </div>
      </li>
    `)

    expect(jobs).toEqual([expect.objectContaining({
      title: 'Legal Operations Manager',
      company: 'Acme',
      url: 'https://www.linkedin.com/jobs/view/4454450309',
      source_board: 'linkedin',
      location: 'São Paulo, SP',
      posted_at: '2026-08-20T00:00:00.000Z',
      company_logo_url: 'https://media.licdn.com/dms/image/company-logo_100_100/0/abc?e=2147483647&v=beta&t=signed',
      accepts_brazil: true,
    })])
  })

  it('parses LinkedIn search markdown returned by the no-key fallback', () => {
    const jobs = parseLinkedInJobsMarkdown(`
      # 68 Legal Operations vagas em Brasil

      * [Controller/Legal Ops](https://br.linkedin.com/jobs/view/controller-legal-ops-at-hero-seguros-4454450309?position=1&pageNum=0)![Image](https://media.licdn.com/dms/image/company-logo_100_100/hero?e=2147483647&v=beta&t=signed) ### Controller/Legal Ops

      #### [Hero Seguros](https://br.linkedin.com/company/heroseguros)

      São Paulo, SP  Há 4 dias
      * [Banco de Talentos - Legal Ops](https://br.linkedin.com/jobs/view/talent-pool-4454450312) ### Banco de Talentos - Legal Ops

      #### [Acme](https://br.linkedin.com/company/acme)

      Brasil  Há 1 dia
    `)

    expect(jobs).toEqual([expect.objectContaining({
      title: 'Controller/Legal Ops',
      company: 'Hero Seguros',
      location: 'São Paulo, SP',
      url: 'https://www.linkedin.com/jobs/view/4454450309',
      company_logo_url: 'https://media.licdn.com/dms/image/company-logo_100_100/hero?e=2147483647&v=beta&t=signed',
    })])
  })

  it('fetches each full LinkedIn search once and deduplicates repeated job ids', async () => {
    const card = (id: string, title: string) => `
      <li><div data-entity-urn="urn:li:jobPosting:${id}">
        <a class="base-card__full-link" href="https://br.linkedin.com/jobs/view/${id}"></a>
        <h3 class="base-search-card__title">${title}</h3>
        <h4 class="base-search-card__subtitle">Acme</h4>
        <span class="job-search-card__location">Brasil</span>
      </div></li>`
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(card('4454450309', 'Legal Operations Manager')))
      .mockResolvedValueOnce(new Response(
        card('4454450309', 'Legal Operations Manager')
        + card('4454450310', 'Controller Jurídico'),
      ))

    const jobs = await scrapeLinkedInJobs({
      searches: [
        { keywords: 'Legal Operations', maxPages: 4 },
        { keywords: 'Controladoria Jurídica', maxPages: 4 },
      ],
      requestDelayMs: 0,
      fetcher,
    })

    expect(jobs.map(job => job.url)).toEqual([
      'https://www.linkedin.com/jobs/view/4454450309',
      'https://www.linkedin.com/jobs/view/4454450310',
    ])
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(new URL(String(fetcher.mock.calls[0][0])).pathname).toBe('/jobs/search')
    expect(new URL(String(fetcher.mock.calls[0][0])).searchParams.get('keywords')).toBe('Legal Operations')
    expect(new URL(String(fetcher.mock.calls[1][0])).searchParams.get('keywords')).toBe('Controladoria Jurídica')
  })

  it('falls back to the no-key reader on LinkedIn rate limiting and keeps prior pages', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 429 }))
      .mockResolvedValueOnce(new Response('', { status: 429 }))
      .mockResolvedValueOnce(new Response(`
        * [Controller Jurídico](https://br.linkedin.com/jobs/view/controller-juridico-at-acme-4454450310) ### Controller Jurídico

        #### [Acme](https://br.linkedin.com/company/acme)

        Brasil  Há 1 dia
      `))
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    try {
      const jobs = await scrapeLinkedInJobs({
        searches: [{ keywords: 'Legal Operations', maxPages: 5 }],
        requestDelayMs: 0,
        fetcher,
      })

      expect(jobs).toHaveLength(1)
      expect(fetcher).toHaveBeenCalledTimes(3)
      expect(String(fetcher.mock.calls[2][0])).toContain('https://r.jina.ai/https://br.linkedin.com/jobs/search')
    } finally {
      warning.mockRestore()
    }
  })

  it('excludes LinkedIn internships and talent pools', () => {
    const jobs = parseLinkedInJobCards(`
      <li><div data-entity-urn="urn:li:jobPosting:4454450311">
        <a class="base-card__full-link" href="https://br.linkedin.com/jobs/view/4454450311"></a>
        <h3 class="base-search-card__title">Estágio em Legal Operations</h3>
        <h4 class="base-search-card__subtitle">Acme</h4>
        <span class="job-search-card__location">Brasil</span>
      </div></li>
      <li><div data-entity-urn="urn:li:jobPosting:4454450312">
        <a class="base-card__full-link" href="https://br.linkedin.com/jobs/view/4454450312"></a>
        <h3 class="base-search-card__title">Banco de Talentos - Legal Ops</h3>
        <h4 class="base-search-card__subtitle">Acme</h4>
        <span class="job-search-card__location">Brasil</span>
      </div></li>
    `)

    expect(jobs).toEqual([])
  })

  it('parses an Ashby Legal Operations role in Brazil', () => {
    const jobs = parseAshbyJobs({
      jobs: [{
        title: 'Legal Operations Manager',
        location: 'São Paulo, Brazil',
        isRemote: false,
        isListed: true,
        jobUrl: 'https://jobs.ashbyhq.com/example/123',
        applyUrl: 'https://jobs.ashbyhq.com/example/123/application',
        publishedAt: '2026-08-17T12:00:00Z',
        compensation: {
          scrapeableCompensationSalarySummary: 'R$ 15.000 - R$ 20.000 / month',
        },
      }],
    }, 'example')

    expect(jobs).toHaveLength(1)
    expect(jobs[0]).toMatchObject({
      source_board: 'ashby',
      company: 'example',
      accepts_brazil: true,
    })
  })

  it('parses a Jooble Legal Ops role in Brazil', () => {
    const jobs = parseJoobleJobs({
      jobs: [{
        title: 'Legal Ops Analyst',
        company: 'Example Co',
        location: 'São Paulo, SP',
        link: 'https://example.com/jobs/legal-ops',
        updated: '2026-08-18',
        salary: 'R$ 8.000 - R$ 10.000',
      }],
    })

    expect(jobs).toHaveLength(1)
    expect(jobs[0].source_board).toBe('jooble')
  })

  it('never exposes the Jooble API key in request errors', async () => {
    const apiKey = 'private-jooble-api-key'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Forbidden', { status: 403 })))

    try {
      await expect(scrapeJooble(apiKey)).rejects.not.toThrow(apiKey)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('parses only active non-internship Gupy portal roles', () => {
    const jobs = parseGupyPortalJobs({
      data: [
        {
          id: 12062408,
          name: 'Analista de Legal Ops',
          careerPageName: 'CGM Advogados',
          careerPageLogo: 'https://assets.gupy.io/production/companies/123/career/logo.png',
          publishedDate: '2026-08-12T19:39:31.955Z',
          applicationDeadline: '2026-09-30',
          type: 'vacancy_type_effective',
          jobUrl: 'https://cgmadvogados.gupy.io/job/active?jobBoardSource=gupy_portal',
          city: 'São Paulo',
          state: 'São Paulo',
          country: 'Brasil',
          workplaceType: 'hybrid',
        },
        {
          id: 12082074,
          name: 'Estágio Legal Operations - Cadastro',
          careerPageName: 'Reis Advogados',
          applicationDeadline: '2026-09-11',
          type: 'vacancy_type_internship',
          jobUrl: 'https://reisadvogados.gupy.io/job/internship',
          city: 'Bebedouro',
          state: 'São Paulo',
          country: 'Brasil',
        },
        {
          id: 11999999,
          name: 'Especialista Legal Ops (vaga banco)',
          careerPageName: 'Example',
          applicationDeadline: '2026-09-20',
          type: 'vacancy_type_talent_pool',
          jobUrl: 'https://example.gupy.io/job/talent-pool',
          city: 'São Paulo',
          state: 'São Paulo',
          country: 'Brasil',
        },
        {
          id: 11000000,
          name: 'Legal Operations Analyst',
          careerPageName: 'Expired Co',
          applicationDeadline: '2026-08-19',
          type: 'vacancy_type_effective',
          jobUrl: 'https://expired.gupy.io/job/expired',
          city: 'São Paulo',
          state: 'São Paulo',
          country: 'Brasil',
        },
      ],
    }, new Date('2026-08-20T12:00:00Z'))

    expect(jobs).toHaveLength(1)
    expect(jobs[0]).toMatchObject({
      title: 'Analista de Legal Ops',
      source_board: 'gupy',
      company: 'CGM Advogados',
      location: 'São Paulo, Brasil',
      accepts_brazil: true,
      company_logo_url: 'https://assets.gupy.io/production/companies/123/career/logo.png',
    })
    expect(jobs[0].url).toBe('https://cgmadvogados.gupy.io/job/active')
  })

  it('parses JobPosting JSON-LD from a company career page', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "JobPosting",
            "title": "Legal Operations Specialist",
            "datePosted": "2026-08-18",
            "validThrough": "2026-09-30T23:59:59Z",
            "hiringOrganization": {
              "@type": "Organization",
              "name": "Acme",
              "logo": "https://acme.example/logo.png"
            },
            "jobLocation": {
              "@type": "Place",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "São Paulo",
                "addressRegion": "SP",
                "addressCountry": "BR"
              }
            },
            "url": "https://acme.example/careers/legal-ops"
          }
        </script>
      </head></html>`

    const jobs = extractJobPostingsFromHtml(html, 'https://acme.example/careers')
    expect(jobs).toHaveLength(1)
    expect(jobs[0]).toMatchObject({
      source_board: 'company_site',
      company: 'Acme',
      company_logo_url: 'https://acme.example/logo.png',
      accepts_brazil: true,
    })
  })

  it('parses an Adzuna Legal Operations role in Brazil', () => {
    const jobs = parseAdzunaJobs({
      results: [{
        title: 'Legal Operations Lead',
        description: 'Legal operations role for the Brazil team.',
        created: '2026-08-18T10:00:00Z',
        redirect_url: 'https://example.com/jobs/legal-operations-lead',
        company: { display_name: 'Example' },
        location: { display_name: 'Brazil' },
        salary_min: 150000,
        salary_max: 190000,
      }],
    })

    expect(jobs).toHaveLength(1)
    expect(jobs[0].source_board).toBe('adzuna')
  })

  it('rejects generic legal roles', () => {
    const jobs = parseJoobleJobs({
      jobs: [{
        title: 'Senior Corporate Lawyer',
        company: 'Example Co',
        location: 'São Paulo, SP',
        link: 'https://example.com/jobs/lawyer',
      }],
    })

    expect(jobs).toHaveLength(0)
  })
})
