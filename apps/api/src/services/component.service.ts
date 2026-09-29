import type { CreateComponentBody, ListComponentsQuery, UpdateComponentBody } from '@sccs/shared'
import type { Prisma } from '../generated/prisma/client'
import { AppError, notFound } from '../errors'
import { prisma } from '../lib/prisma'
import { audit } from './audit.service'
import { assertExists as assertCategory, breadcrumb, descendantIds } from './category.service'

export const summaryInclude = {
  notation: { select: { id: true, name: true, kind: true } },
  category: { select: { id: true, name: true, slug: true } },
  keywords: { select: { keyword: { select: { id: true, term: true } } } },
} satisfies Prisma.ComponentInclude

type Row = Prisma.ComponentGetPayload<{ include: typeof summaryInclude }>

/** Flattens keyword links and drops the heavy `content` and internal fields. */
export function toSummary({
  keywords,
  content: _c,
  createdById: _b,
  notationId: _n,
  categoryId: _k,
  ...c
}: Row) {
  return {
    ...c,
    keywords: keywords.map((k) => k.keyword).sort((a, b) => a.term.localeCompare(b.term)),
  }
}

export const ORDER: Record<
  ListComponentsQuery['sort'],
  Prisma.ComponentOrderByWithRelationInput[]
> = {
  name: [{ name: 'asc' }, { id: 'asc' }],
  newest: [{ createdAt: 'desc' }, { id: 'asc' }],
  mostUsed: [{ useCount: 'desc' }, { name: 'asc' }],
}

/** Category filter as an id list; throws NOT_FOUND for an unknown category. */
export async function categoryFilter(categoryId: string, includeDescendants: boolean) {
  await assertCategory(categoryId)
  return includeDescendants ? [categoryId, ...(await descendantIds(categoryId))] : [categoryId]
}

export async function list(q: ListComponentsQuery) {
  const where: Prisma.ComponentWhereInput = { kind: q.kind, notationId: q.notationId }
  if (q.categoryId)
    where.categoryId = { in: await categoryFilter(q.categoryId, q.includeDescendants) }
  if (q.q)
    where.OR = [
      { name: { contains: q.q, mode: 'insensitive' } },
      { description: { contains: q.q, mode: 'insensitive' } },
    ]
  const [total, rows] = await Promise.all([
    prisma.component.count({ where }),
    prisma.component.findMany({
      where,
      include: summaryInclude,
      orderBy: ORDER[q.sort],
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
  ])
  return { items: rows.map(toSummary), page: q.page, pageSize: q.pageSize, total }
}

export async function get(id: string) {
  const row = await prisma.component.findUnique({
    where: { id },
    include: { ...summaryInclude, createdBy: { select: { id: true, name: true } } },
  })
  if (!row) throw notFound('Component')
  const { createdBy, ...rest } = row
  const summary = toSummary(rest)
  return {
    ...summary,
    content: row.content,
    createdBy,
    category: { ...summary.category, breadcrumb: await breadcrumb(row.categoryId) },
  }
}

async function assertNotationKind(notationId: string, kind: string) {
  const notation = await prisma.notation.findUnique({ where: { id: notationId } })
  if (!notation) throw notFound('Notation')
  if (notation.kind !== kind)
    throw new AppError(
      'NOTATION_KIND_MISMATCH',
      422,
      `${notation.name} is a ${notation.kind.toLowerCase()} notation, not ${kind.toLowerCase()}`,
    )
}

export const linkKeywords = (terms: string[]) =>
  terms.map((term) => ({ keyword: { connectOrCreate: { where: { term }, create: { term } } } }))

export async function create({ keywords, ...body }: CreateComponentBody, actorId: string) {
  await assertNotationKind(body.notationId, body.kind)
  await assertCategory(body.categoryId)
  const id = await prisma.$transaction(async (tx) => {
    const c = await tx.component.create({
      data: { ...body, createdById: actorId, keywords: { create: linkKeywords(keywords) } },
    })
    await audit(tx, actorId, 'COMPONENT_CREATE', 'Component', c.id, { name: c.name, keywords })
    return c.id
  })
  return get(id)
}

export async function update(id: string, body: UpdateComponentBody, actorId: string) {
  const current = await prisma.component.findUnique({ where: { id } })
  if (!current) throw notFound('Component')
  if (body.kind !== undefined || body.notationId !== undefined)
    await assertNotationKind(body.notationId ?? current.notationId, body.kind ?? current.kind)
  if (body.categoryId) await assertCategory(body.categoryId)
  await prisma.$transaction(async (tx) => {
    await tx.component.update({ where: { id }, data: body })
    await audit(tx, actorId, 'COMPONENT_UPDATE', 'Component', id, {
      fields: Object.keys(body).filter((k) => body[k as keyof typeof body] !== undefined),
    })
  })
  return get(id)
}

export async function remove(id: string, actorId: string) {
  const c = await prisma.component.findUnique({ where: { id }, select: { name: true } })
  if (!c) throw notFound('Component')
  await prisma.$transaction(async (tx) => {
    await tx.component.delete({ where: { id } })
    await audit(tx, actorId, 'COMPONENT_DELETE', 'Component', id, { name: c.name })
  })
}
