import { describe, expect, it } from 'vitest'
import { createComponentBody, keywordTerms, listComponentsQuery, pageQuery } from './schemas'

describe('shared schemas', () => {
  it('T-12 keyword terms are trimmed, lowercased and de-duplicated', () => {
    expect(keywordTerms(0, 50).parse([' CSV', 'csv', 'Parser'])).toEqual(['csv', 'parser'])
    expect(keywordTerms(0, 50).safeParse(['x'.repeat(51)]).success).toBe(false)
    expect(keywordTerms(0, 50).safeParse(['   ']).success).toBe(false)
    expect(keywordTerms(1, 50).safeParse([]).success).toBe(false)
  })

  it('pageSize bounds', () => {
    expect(pageQuery.parse({})).toEqual({ page: 1, pageSize: 20 })
    for (const bad of [{ page: 0 }, { pageSize: 0 }, { pageSize: 51 }, { page: 'x' }])
      expect(pageQuery.safeParse(bad).success).toBe(false)
  })

  it('component body strips counters and checks url scheme', () => {
    const base = { name: 'n', description: 'd', kind: 'CODE', notationId: 'a', categoryId: 'b' }
    const parsed = createComponentBody.parse({ ...base, useCount: 99 })
    expect(parsed).not.toHaveProperty('useCount')
    expect(parsed.version).toBe('1.0.0')
    expect(createComponentBody.safeParse({ ...base, sourceUrl: 'ftp://x.org' }).success).toBe(false)
    expect(createComponentBody.safeParse({ ...base, sourceUrl: 'https://x.org' }).success).toBe(
      true,
    )
  })

  it('includeDescendants parses from query strings', () => {
    expect(listComponentsQuery.parse({ includeDescendants: 'true' }).includeDescendants).toBe(true)
    expect(listComponentsQuery.parse({}).includeDescendants).toBe(false)
    expect(listComponentsQuery.safeParse({ includeDescendants: 'yes' }).success).toBe(false)
  })
})
