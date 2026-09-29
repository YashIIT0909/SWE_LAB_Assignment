import type { SearchBody } from '@sccs/shared'
import type { Prisma } from '../generated/prisma/client'
import { notFound } from '../errors'
import { prisma } from '../lib/prisma'
import { categoryFilter, summaryInclude, toSummary } from './component.service'

export interface Candidate {
  id: string
  name: string
  useCount: number
  keywords: string[]
}

export interface Ranked {
  id: string
  score: number
  matchedKeywords: string[]
}

/** 2 if the keyword equals the term, 1 if it starts with a term of length >= 3, else 0. */
export const termScore = (term: string, keyword: string) =>
  keyword === term ? 2 : term.length >= 3 && keyword.startsWith(term) ? 1 : 0

/** Scores, filters by match mode and orders: score desc, useCount desc, name asc. */
export function rank(terms: string[], candidates: Candidate[], match: 'any' | 'all'): Ranked[] {
  const ranked: (Ranked & { c: Candidate })[] = []
  for (const c of candidates) {
    const best = terms.map((t) => Math.max(0, ...c.keywords.map((k) => termScore(t, k))))
    const hits = best.filter((s) => s > 0).length
    if (hits === 0 || (match === 'all' && hits < terms.length)) continue
    ranked.push({
      c,
      id: c.id,
      score: best.reduce((a, b) => a + b, 0),
      matchedKeywords: c.keywords.filter((k) => terms.some((t) => termScore(t, k) > 0)).sort(),
    })
  }
  ranked.sort(
    (a, b) =>
      b.score - a.score ||
      b.c.useCount - a.c.useCount ||
      (a.c.name < b.c.name ? -1 : a.c.name > b.c.name ? 1 : 0) ||
      (a.id < b.id ? -1 : 1),
  )
  return ranked.map(({ c: _c, ...r }) => r)
}

// ponytail: scores every candidate in memory; fine for ~10k components (NFR-1),
// move scoring into SQL if the catalogue grows far beyond that
export async function search(body: SearchBody, userId?: string) {
  const { keywords: terms, match, kind, notationId, categoryId, includeDescendants } = body
  if (notationId && !(await prisma.notation.findUnique({ where: { id: notationId } })))
    throw notFound('Notation')

  const where: Prisma.ComponentWhereInput = { kind, notationId }
  if (categoryId) where.categoryId = { in: await categoryFilter(categoryId, includeDescendants) }

  const matching = await prisma.keyword.findMany({
    where: {
      OR: [
        { term: { in: terms } },
        ...terms.filter((t) => t.length >= 3).map((t) => ({ term: { startsWith: t } })),
      ],
    },
    select: { id: true },
  })
  const candidates = await prisma.component.findMany({
    where: { ...where, keywords: { some: { keywordId: { in: matching.map((k) => k.id) } } } },
    select: {
      id: true,
      name: true,
      useCount: true,
      keywords: { select: { keyword: { select: { term: true } } } },
    },
  })
  const ranked = rank(
    terms,
    candidates.map((c) => ({ ...c, keywords: c.keywords.map((k) => k.keyword.term) })),
    match,
  )

  const start = (body.page - 1) * body.pageSize
  const pageItems = ranked.slice(start, start + body.pageSize)
  const ids = pageItems.map((r) => r.id)

  const queryId = await prisma.$transaction(async (tx) => {
    const q = await tx.searchQuery.create({
      data: {
        userId,
        terms,
        filters: { match, kind, notationId, categoryId, includeDescendants },
        resultCount: ranked.length,
        results: {
          create: pageItems.map((r, i) => ({ componentId: r.id, rank: start + i + 1 })),
        },
      },
    })
    await tx.component.updateMany({
      where: { id: { in: ids } },
      data: { queryHitCount: { increment: 1 }, queryHitNotUsedCount: { increment: 1 } },
    })
    return q.id
  })

  const rows = await prisma.component.findMany({
    where: { id: { in: ids } },
    include: summaryInclude,
  })
  const byId = new Map(rows.map((r) => [r.id, toSummary(r)]))
  return {
    queryId,
    items: pageItems.map((r) => ({
      ...byId.get(r.id)!,
      matchedKeywords: r.matchedKeywords,
      score: r.score,
    })),
    page: body.page,
    pageSize: body.pageSize,
    total: ranked.length,
  }
}
