import { notFound } from '../errors'
import type { Prisma } from '../generated/prisma/client'
import { prisma } from '../lib/prisma'
import { audit } from './audit.service'

async function assertComponent(id: string) {
  if (!(await prisma.component.findUnique({ where: { id }, select: { id: true } })))
    throw notFound('Component')
}

async function linked(tx: Prisma.TransactionClient, componentId: string) {
  const links = await tx.componentKeyword.findMany({
    where: { componentId },
    select: { keyword: { select: { id: true, term: true } } },
    orderBy: { keyword: { term: 'asc' } },
  })
  return { componentId, keywords: links.map((l) => l.keyword) }
}

async function link(tx: Prisma.TransactionClient, componentId: string, terms: string[]) {
  if (terms.length === 0) return
  await tx.keyword.createMany({ data: terms.map((term) => ({ term })), skipDuplicates: true })
  const kws = await tx.keyword.findMany({ where: { term: { in: terms } }, select: { id: true } })
  await tx.componentKeyword.createMany({
    data: kws.map((k) => ({ componentId, keywordId: k.id })),
    skipDuplicates: true,
  })
}

export async function replace(componentId: string, terms: string[], actorId: string) {
  await assertComponent(componentId)
  return prisma.$transaction(async (tx) => {
    await tx.componentKeyword.deleteMany({ where: { componentId } })
    await link(tx, componentId, terms)
    await audit(tx, actorId, 'KEYWORDS_UPDATE', 'Component', componentId, { replace: terms })
    return linked(tx, componentId)
  })
}

export async function add(componentId: string, terms: string[], actorId: string) {
  await assertComponent(componentId)
  return prisma.$transaction(async (tx) => {
    await link(tx, componentId, terms)
    await audit(tx, actorId, 'KEYWORDS_UPDATE', 'Component', componentId, { add: terms })
    return linked(tx, componentId)
  })
}

export async function remove(componentId: string, keywordId: string, actorId: string) {
  await assertComponent(componentId)
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.componentKeyword.deleteMany({ where: { componentId, keywordId } })
    if (count === 0) throw notFound('Keyword on this component')
    await audit(tx, actorId, 'KEYWORDS_UPDATE', 'Component', componentId, { remove: keywordId })
    return linked(tx, componentId)
  })
}

export async function suggest(prefix: string, limit: number) {
  const rows = await prisma.keyword.findMany({
    where: prefix ? { term: { startsWith: prefix } } : undefined,
    orderBy: [{ components: { _count: 'desc' } }, { term: 'asc' }],
    take: limit,
    select: { id: true, term: true, _count: { select: { components: true } } },
  })
  return rows.map(({ _count, ...k }) => ({ ...k, componentCount: _count.components }))
}
