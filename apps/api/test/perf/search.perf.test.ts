import { describe, expect, it } from 'vitest'
import { rank, type Candidate } from '../../src/services/search.service'

describe('T-40 NFR-1 performance test', () => {
  it('T-40 rank 10,000 components with 5,000 keywords across 200 random searches has p95 < 500ms', () => {
    // Generate pool of 5,000 keywords
    const keywordsPool: string[] = []
    for (let i = 0; i < 5000; i++) {
      keywordsPool.push(`kw_${i}_term`)
    }

    // Generate 10,000 candidate components with ~5 keywords each
    const candidates: Candidate[] = []
    for (let i = 0; i < 10000; i++) {
      const componentKeywords: string[] = []
      for (let k = 0; k < 5; k++) {
        const kwIndex = (i * 5 + k) % 5000
        componentKeywords.push(keywordsPool[kwIndex]!)
      }
      candidates.push({
        id: `comp_${i}`,
        name: `Component ${i}`,
        useCount: i % 50,
        keywords: componentKeywords,
      })
    }

    // Run 200 random searches (2 terms each, alternating any/all)
    const latencies: number[] = []
    for (let s = 0; s < 200; s++) {
      const idx1 = Math.floor(Math.random() * 5000)
      const idx2 = Math.floor(Math.random() * 5000)
      const term1 = keywordsPool[idx1]!.slice(0, 5) // prefix match test
      const term2 = keywordsPool[idx2]! // exact match test
      const match = s % 2 === 0 ? 'any' : 'all'

      const start = performance.now()
      const results = rank([term1, term2], candidates, match)
      const duration = performance.now() - start
      latencies.push(duration)

      expect(Array.isArray(results)).toBe(true)
    }

    // Calculate p95 latency
    latencies.sort((a, b) => a - b)
    const p95Index = Math.floor(latencies.length * 0.95)
    const p95 = latencies[p95Index]!

    // NFR-1 requirement: p95 < 500ms
    expect(p95).toBeLessThan(500)
  })
})
