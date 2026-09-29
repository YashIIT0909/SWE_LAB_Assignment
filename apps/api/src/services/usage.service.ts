import { notFound } from '../errors'
import { prisma } from '../lib/prisma'

export async function use(componentId: string, userId: string, queryId?: string) {
  return prisma.$transaction(async (tx) => {
    if (!(await tx.component.findUnique({ where: { id: componentId }, select: { id: true } })))
      throw notFound('Component')

    let countedQueryHit = false
    let linkedQuery: string | null = null
    if (queryId) {
      linkedQuery = (await tx.searchQuery.findUnique({
        where: { id: queryId },
        select: { id: true },
      }))
        ? queryId
        : null
      // conditional update: concurrent uses of the same result flip it only once
      const { count } = await tx.searchResult.updateMany({
        where: { queryId, componentId, used: false },
        data: { used: true },
      })
      countedQueryHit = count === 1
      if (countedQueryHit)
        await tx.component.updateMany({
          where: { id: componentId, queryHitNotUsedCount: { gt: 0 } },
          data: { queryHitNotUsedCount: { decrement: 1 } },
        })
    }

    const c = await tx.component.update({
      where: { id: componentId },
      data: { useCount: { increment: 1 }, lastUsedAt: new Date() },
      select: { useCount: true, queryHitCount: true, queryHitNotUsedCount: true, lastUsedAt: true },
    })
    await tx.usageEvent.create({ data: { componentId, userId, queryId: linkedQuery } })
    return { componentId, ...c, countedQueryHit }
  })
}
