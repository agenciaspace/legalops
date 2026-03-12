import { describe, expect, it } from 'vitest'
import {
  buildLeaderSearchQueries,
  parseDuckDuckGoResults,
  selectLeaderFromSearchResults,
} from '@/lib/leader-research'

describe('buildLeaderSearchQueries', () => {
  it('searches public legal leadership titles for the company', () => {
    const queries = buildLeaderSearchQueries('nubank')

    expect(queries).toHaveLength(2)
    expect(queries[0]).toContain('"Nubank"')
    expect(queries.join(' ')).toContain('"head of legal"')
    expect(queries.join(' ')).toContain('"chief legal officer"')
    expect(queries.join(' ')).toContain('"head of legal operations"')
  })
})

describe('parseDuckDuckGoResults', () => {
  it('extracts title, snippet and canonical url from html results', () => {
    const html = `
      <div class="result results_links results_links_deep web-result ">
        <div class="links_main links_deep result__body">
          <h2 class="result__title">
            <a rel="nofollow" class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fbr.linkedin.com%2Fin%2Ftina-marcondes">Tina Marcondes - Head of Legal Brazil - Nubank | LinkedIn</a>
          </h2>
          <a class="result__snippet" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fbr.linkedin.com%2Fin%2Ftina-marcondes">Head of Legal Brazil at Nubank.</a>
          <span class="result__url">br.linkedin.com/in/tina-marcondes</span>
        </div>
      </div>
    `

    const results = parseDuckDuckGoResults(html)

    expect(results).toEqual([
      {
        title: 'Tina Marcondes - Head of Legal Brazil - Nubank | LinkedIn',
        snippet: 'Head of Legal Brazil at Nubank.',
        url: 'https://br.linkedin.com/in/tina-marcondes',
        displayUrl: 'br.linkedin.com/in/tina-marcondes',
      },
    ])
  })
})

describe('selectLeaderFromSearchResults', () => {
  it('prefers legal ops leadership when the job is a legal ops role', () => {
    const results = [
      {
        title: 'Paula Souza - General Counsel - Nubank | LinkedIn',
        snippet: 'General Counsel at Nubank.',
        url: 'https://linkedin.com/in/paula-souza',
        displayUrl: 'linkedin.com/in/paula-souza',
      },
      {
        title: 'Tina Marcondes - Head of Legal Operations - Nubank',
        snippet: 'Head of Legal Operations at Nubank.',
        url: 'https://nubank.com.br/en/about-us/leadership/tina-marcondes',
        displayUrl: 'nubank.com.br',
      },
      {
        title: 'Tina Marcondes - Head of Legal Operations - Nubank | LinkedIn',
        snippet: 'Head of Legal Operations at Nubank.',
        url: 'https://linkedin.com/in/tina-marcondes',
        displayUrl: 'linkedin.com/in/tina-marcondes',
      },
    ]

    const leader = selectLeaderFromSearchResults(results, {
      company: 'nubank',
      jobTitle: 'Senior Legal Operations Manager',
    })

    expect(leader).toEqual({
      suggested_leader_name: 'Tina Marcondes',
      suggested_leader_title: 'Head of Legal Operations',
      suggested_leader_linkedin: 'https://linkedin.com/in/tina-marcondes',
    })
  })

  it('ignores results that do not clearly match the company', () => {
    const results = [
      {
        title: 'Alice Johnson - General Counsel - AnotherCo | LinkedIn',
        snippet: 'General Counsel at AnotherCo.',
        url: 'https://linkedin.com/in/alice-johnson',
        displayUrl: 'linkedin.com/in/alice-johnson',
      },
    ]

    const leader = selectLeaderFromSearchResults(results, {
      company: 'nubank',
      jobTitle: 'Legal Operations Analyst',
    })

    expect(leader).toBeNull()
  })
})
