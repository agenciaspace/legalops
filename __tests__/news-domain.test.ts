// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { DEFAULT_NEWS_PREFERENCES, parseNewsPreferences, parseNewsSignup, parseNewsArticle, matchesNewsPreferences, type NewsArticle } from '@/lib/news'
import { newsPublicPath } from '@/lib/news-routing'
import { newsCandidateFromSearch } from '@/lib/news-discovery'
import launch from '@/data/news-launch.json'

describe('News editorial boundaries', () => {
  it('requires explicit opt-in and accepts combined audiences and topics', () => {
    expect(DEFAULT_NEWS_PREFERENCES.enabled).toBe(false)
    expect(parseNewsPreferences({ enabled: true, audiences: ['escritorios','escritorios','prestadores'], topics: ['governanca'] })).toEqual({ enabled: true, audiences: ['escritorios','prestadores'], topics: ['governanca'] })
    expect(() => parseNewsPreferences({ enabled: 'yes', audiences: [], topics: [] })).toThrow()
    expect(() => parseNewsPreferences({ enabled: true, audiences: ['admin'], topics: [] })).toThrow()
    expect(() => parseNewsPreferences({ enabled: true, audiences: [], topics: ['unknown'] })).toThrow()
  })
  it('matches OR within each dimension and AND between dimensions', () => {
    const article = { audiences: ['escritorios'], topics: ['governanca'] } as NewsArticle
    expect(matchesNewsPreferences(article,{enabled:true,audiences:[],topics:[]})).toBe(true)
    expect(matchesNewsPreferences(article,{enabled:true,audiences:['escritorios','prestadores'],topics:['governanca']})).toBe(true)
    expect(matchesNewsPreferences(article,{enabled:true,audiences:['escritorios'],topics:['ia-tecnologia']})).toBe(false)
  })
  it('requires newsletter consent and normalizes email without opting into Club', () => {
    expect(() => parseNewsSignup({email:'reader@example.com',consent:false})).toThrow()
    expect(() => parseNewsSignup({email:'invalid',consent:true})).toThrow()
    expect(parseNewsSignup({email:' READER@EXAMPLE.COM ',consent:true,audiences:['prestadores']})).toMatchObject({email:'reader@example.com',audiences:['prestadores']})
  })
  it('validates initial reviewed stories and rejects unsupported claims without sources or impact', () => {
    for (const article of launch) expect(parseNewsArticle(article).slug).toBe(article.slug)
    expect(() => parseNewsArticle({...launch[0],sources:[{title:'Source',url:'javascript:alert(1)'}]})).toThrow()
    expect(() => parseNewsArticle({...launch[0],impact:{}})).toThrow()
    expect(() => parseNewsArticle({...launch[0],event_date:'2026-02-31'})).toThrow()
  })
  it('exposes only public News paths and keeps administration private on both hosts', () => {
    expect(newsPublicPath('/',true)).toBe('/news')
    expect(newsPublicPath('/escritorios',true)).toBe('/news/escritorios')
    expect(newsPublicPath('/noticias/a-real-story',true)).toBe('/news/noticias/a-real-story')
    expect(newsPublicPath('/news',false)).toBe('/news')
    for(const path of ['/news/admin','/api/news/admin','/community/news/manage','/escritorios/admin','/community']) expect(newsPublicPath(path,true)).toBeNull()
    expect(newsPublicPath('/escritorios',false)).toBeNull()
  })
  it('keeps discovery on known primary-source domains and removes tracking', () => {
    expect(newsCandidateFromSearch({url:'https://legora.com/newsroom/announcement?utm_source=ads#part',title:'Announcement',description:'A release'})).toMatchObject({url:'https://legora.com/newsroom/announcement'})
    for(const url of ['http://legora.com/news','https://legora.com.evil.test/news','https://127.0.0.1/admin','https://legora.com/'])expect(newsCandidateFromSearch({url,title:'t',description:'d'})).toBeNull()
  })
})
