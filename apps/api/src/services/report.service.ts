import type { AuditAction, PurgeParams } from '@sccs/shared'
import type { Prisma } from '../generated/prisma/client'
import { prisma } from '../lib/prisma'
import { audit as writeAudit } from './audit.service'

const DAY = 86_400_000

export async function summary() {
  const [
    byKind,
    categories,
    keywords,
    searches,
    uses,
    notations,
    topUsed,
    topNotUsed,
    neverUsedCount,
  ] = await Promise.all([
    prisma.component.groupBy({ by: ['kind'], _count: { _all: true } }),
    prisma.category.count(),
    prisma.keyword.count(),
    prisma.searchQuery.count(),
    prisma.usageEvent.count(),
    prisma.notation.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, kind: true, _count: { select: { components: true } } },
    }),
    prisma.component.findMany({
      where: { useCount: { gt: 0 } },
      orderBy: [{ useCount: 'desc' }, { name: 'asc' }],
      take: 10,
      select: { id: true, name: true, useCount: true },
    }),
    prisma.component.findMany({
      where: { queryHitNotUsedCount: { gt: 0 } },
      orderBy: [{ queryHitNotUsedCount: 'desc' }, { name: 'asc' }],
      take: 10,
      select: { id: true, name: true, queryHitNotUsedCount: true, useCount: true },
    }),
    prisma.component.count({ where: { useCount: 0 } }),
  ])
  const kind = (k: string) => byKind.find((g) => g.kind === k)?._count._all ?? 0
  return {
    totals: {
      components: kind('DESIGN') + kind('CODE'),
      design: kind('DESIGN'),
      code: kind('CODE'),
      categories,
      keywords,
      searches,
      uses,
    },
    byNotation: notations.map((n) => ({
      notationId: n.id,
      name: n.name,
      kind: n.kind,
      components: n._count.components,
    })),
    topUsed,
    topNotUsed,
    neverUsedCount,
  }
}

/** Purge criteria as a Prisma filter, evaluated relative to `now`. */
export function candidateWhere(p: PurgeParams, now = new Date()): Prisma.ComponentWhereInput {
  return {
    useCount: { lte: p.maxUses },
    queryHitNotUsedCount: { gte: p.minNotUsedHits },
    OR: [
      { lastUsedAt: null },
      { lastUsedAt: { lt: new Date(now.getTime() - p.unusedForDays * DAY) } },
    ],
    createdAt: { lt: new Date(now.getTime() - p.olderThanDays * DAY) },
  }
}

export async function purgeCandidates(q: PurgeParams & { page: number; pageSize: number }) {
  const { page, pageSize, ...params } = q
  const where = candidateWhere(params)
  const [total, items] = await Promise.all([
    prisma.component.count({ where }),
    prisma.component.findMany({
      where,
      orderBy: [{ queryHitNotUsedCount: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        kind: true,
        useCount: true,
        queryHitCount: true,
        queryHitNotUsedCount: true,
        lastUsedAt: true,
        createdAt: true,
      },
    }),
  ])
  return { params, items, page, pageSize, total }
}

export async function purge(componentIds: string[], params: PurgeParams, actorId: string) {
  const ids = [...new Set(componentIds)]
  return prisma.$transaction(async (tx) => {
    const found = await tx.component.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        useCount: true,
        queryHitCount: true,
        queryHitNotUsedCount: true,
      },
    })
    const byId = new Map(found.map((c) => [c.id, c]))
    const where = candidateWhere(params)
    const deleted: string[] = []
    const skipped: { id: string; reason: 'NOT_FOUND' | 'NO_LONGER_CANDIDATE' }[] = []
    for (const id of ids) {
      const c = byId.get(id)
      if (!c) {
        skipped.push({ id, reason: 'NOT_FOUND' })
        continue
      }
      // re-check and delete in one statement so a concurrent use cannot slip in between
      const { count } = await tx.component.deleteMany({ where: { AND: [{ id }, where] } })
      if (count === 0) {
        skipped.push({ id, reason: 'NO_LONGER_CANDIDATE' })
        continue
      }
      const { id: _id, ...details } = c
      await writeAudit(tx, actorId, 'COMPONENT_PURGE', 'Component', id, { ...details, params })
      deleted.push(id)
    }
    return { deleted, skipped }
  })
}

export async function auditLog(q: {
  page: number
  pageSize: number
  action?: AuditAction
  entityType?: string
}) {
  const where = { action: q.action, entityType: q.entityType }
  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
      select: {
        id: true,
        actor: { select: { id: true, name: true } },
        action: true,
        entityType: true,
        entityId: true,
        details: true,
        createdAt: true,
      },
    }),
  ])
  return { items, page: q.page, pageSize: q.pageSize, total }
}
