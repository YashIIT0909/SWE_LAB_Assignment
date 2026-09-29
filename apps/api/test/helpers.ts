import bcrypt from 'bcryptjs'
import type { Role } from '@sccs/shared'
import { NOTATIONS } from '../prisma/seed-data'
import { prisma } from '../src/lib/prisma'
import { sign } from '../src/services/auth.service'

export { prisma }

export async function resetDb() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "AuditLog","UsageEvent","SearchResult","SearchQuery","ComponentKeyword","Keyword","Component","Notation","Category","User" CASCADE',
  )
}

export async function seedNotations() {
  await prisma.notation.createMany({ data: NOTATIONS.map(([name, kind]) => ({ name, kind })) })
  const all = await prisma.notation.findMany()
  return Object.fromEntries(all.map((n) => [n.name, n]))
}

let n = 0
export async function createUser(role: Role = 'USER', password = 'password123') {
  const user = await prisma.user.create({
    data: {
      name: `${role} ${++n}`,
      email: `${role.toLowerCase()}${n}@test.local`,
      role,
      passwordHash: await bcrypt.hash(password, 4),
    },
  })
  return { user, token: sign(user), auth: { Authorization: `Bearer ${sign(user)}` } }
}
