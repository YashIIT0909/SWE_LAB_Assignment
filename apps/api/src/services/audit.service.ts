import type { AuditAction } from '@sccs/shared'
import type { Prisma } from '../generated/prisma/client'

/** Writes one audit row inside the caller's transaction. */
export function audit(
  tx: Prisma.TransactionClient,
  actorId: string,
  action: AuditAction,
  entityType: 'Component' | 'Category' | 'Notation',
  entityId: string,
  details?: Prisma.InputJsonValue,
) {
  return tx.auditLog.create({ data: { actorId, action, entityType, entityId, details } })
}
