import type { HealthResponse } from '@sccs/shared'
import { prisma } from '../lib/prisma'

export async function check(): Promise<HealthResponse> {
  const time = new Date().toISOString()
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'ok', db: 'ok', time }
  } catch {
    return { status: 'degraded', db: 'down', time }
  }
}
