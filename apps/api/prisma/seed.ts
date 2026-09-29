import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma'
import { linkKeywords } from '../src/services/component.service'
import { DEMO_COMPONENTS, NOTATIONS } from './seed-data'
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
  const cataloguer = await prisma.user.upsert({
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

  if ((await prisma.component.count()) === 0) {
    const notations = new Map((await prisma.notation.findMany()).map((n) => [n.name, n.id]))
    const cats = new Map((await prisma.category.findMany()).map((c) => [c.name, c.id]))
    for (const [name, kind, notation, cat, keywords, description] of DEMO_COMPONENTS)
      await prisma.component.create({
        data: {
          name,
          kind,
          description,
          notationId: notations.get(notation)!,
          categoryId: cats.get(cat)!,
          createdById: cataloguer.id,
          keywords: { create: linkKeywords([...keywords]) },
        },
      })
  }
  console.log('Seed complete')
}

main().finally(() => prisma.$disconnect())
