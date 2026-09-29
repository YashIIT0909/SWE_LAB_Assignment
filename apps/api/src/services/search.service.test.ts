import { describe, expect, it } from 'vitest'
import { rank, termScore } from './search.service'

const c = (id: string, keywords: string[], useCount = 0, name = id) => ({
  id,
  name,
  useCount,
  keywords,
})

describe('search ranking', () => {
  it('T-16 exact = 2, prefix with term >= 3 = 1, short prefix = 0', () => {
    expect(termScore('parser', 'parser')).toBe(2)
    expect(termScore('par', 'parsers')).toBe(1)
    expect(termScore('pa', 'parser')).toBe(0)
    expect(termScore('parsers', 'parser')).toBe(0)
    const r = rank(['parser'], [c('a', ['parser', 'parsers']), c('b', ['parsers'])], 'any')
    expect(r).toEqual([
      { id: 'a', score: 2, matchedKeywords: ['parser', 'parsers'] },
      { id: 'b', score: 1, matchedKeywords: ['parsers'] },
    ])
    expect(rank(['pa'], [c('a', ['parser'])], 'any')).toEqual([])
  })

  it('T-17 all requires every term, any requires one', () => {
    const cs = [
      c('both', ['csv', 'xml']),
      c('csv', ['csv']),
      c('xml', ['xml']),
      c('none', ['json']),
    ]
    expect(rank(['csv', 'xml'], cs, 'all').map((r) => r.id)).toEqual(['both'])
    expect(rank(['csv', 'xml'], cs, 'any').map((r) => r.id)).toEqual(['both', 'csv', 'xml'])
  })

  it('T-18 ties broken by useCount desc then name asc', () => {
    const cs = [
      c('1', ['csv'], 1, 'Zeta'),
      c('2', ['csv'], 5, 'Beta'),
      c('3', ['csv'], 1, 'Alpha'),
      c('4', ['csvx'], 99, 'Top'),
    ]
    expect(rank(['csv'], cs, 'any').map((r) => r.id)).toEqual(['2', '3', '1', '4'])
  })

  it('score sums the best match per term', () => {
    const r = rank(['csv', 'parser'], [c('w', ['csv', 'parsers'])], 'all')
    expect(r[0]).toEqual({ id: 'w', score: 3, matchedKeywords: ['csv', 'parsers'] })
  })
})
