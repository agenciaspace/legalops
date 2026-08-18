import { describe, expect, it } from 'vitest'
import {
  extractJobPostingsFromHtml,
  parseAdzunaJobs,
  parseAshbyJobs,
  parseJoobleJobs,
} from '@/lib/job-discovery'

describe('multi-source job discovery parsers', () => {
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
            "hiringOrganization": { "@type": "Organization", "name": "Acme" },
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
