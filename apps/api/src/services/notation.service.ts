import type { ComponentKind, CreateNotationBody } from '@sccs/shared'
import { AppError } from '../errors'
import { prisma } from '../lib/prisma'
import { audit } from './audit.service'

export const list = (kind?: ComponentKind) =>
  prisma.notation.findMany({ where: { kind }, orderBy: { name: 'asc' } })

export async function create(body: CreateNotationBody, actorId: string) {
  const clash = await prisma.notation.findFirst({
    where: { name: { equals: body.name, mode: 'insensitive' } },
  })
  if (clash) throw new AppError('DUPLICATE_NAME', 409, `Notation "${body.name}" already exists`)
  return prisma.$transaction(async (tx) => {
    const n = await tx.notation.create({ data: body })
    await audit(tx, actorId, 'NOTATION_CREATE', 'Notation', n.id, body)
    return n
  })
}
