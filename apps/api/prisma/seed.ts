import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma'
import { NOTATIONS } from './seed-data'
import { slugify } from '@sccs/shared'

const TREE: Record<string, string[]> = {
  'Design patterns': ['Creational patterns', 'Structural patterns', 'Behavioural patterns'],
  'Data processing': ['Parsing', 'Sorting and searching'],
  'Web development': ['UI widgets', 'Authentication'],
}

async function category(name: string, parentId: string | null) {
  const existing = await prisma.category.findFirst({ where: { name, parentId } })
  return existing ?? prisma.category.create({ data: { name, slug: slugify(name), parentId } })
}

async function main() {
  for (const [name, kind] of NOTATIONS)
    await prisma.notation.upsert({ where: { name }, update: {}, create: { name, kind } })

  const email = (process.env.SEED_CATALOGUER_EMAIL ?? 'cat@sccs.local').toLowerCase()
  const password = process.env.SEED_CATALOGUER_PASSWORD
  if (!password) throw new Error('SEED_CATALOGUER_PASSWORD is not set')
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: 'Head Cataloguer',
      email,
      role: 'CATALOGUER',
      passwordHash: await bcrypt.hash(password, 10),
    },
  })

  for (const [root, children] of Object.entries(TREE)) {
    const r = await category(root, null)
    for (const child of children) await category(child, r.id)
  }
  console.log('Seed complete')
}

main().finally(() => prisma.$disconnect())
