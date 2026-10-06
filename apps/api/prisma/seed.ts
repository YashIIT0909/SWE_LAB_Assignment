import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma'
import { CONTENT } from './seed-content'
import { linkKeywords } from '../src/services/component.service'
import { DEMO_COMPONENTS, NOTATIONS, STALE_DEMO_AGE_DAYS, STALE_DEMO_COMPONENTS } from './seed-data'
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

  const notations = new Map((await prisma.notation.findMany()).map((n) => [n.name, n.id]))
  const cats = new Map((await prisma.category.findMany()).map((c) => [c.name, c.id]))
  async function addComponents(
    list: typeof DEMO_COMPONENTS | typeof STALE_DEMO_COMPONENTS,
    createdAt?: Date,
  ) {
    for (const [name, kind, notation, cat, keywords, description] of list) {
      const existing = await prisma.component.findFirst({ where: { name } })
      if (existing && !existing.content && CONTENT[name]) {
        await prisma.component.update({
          where: { id: existing.id },
          data: { content: CONTENT[name] },
        })
      }
      if (!existing) {
        await prisma.component.create({
          data: {
            name,
            kind,
            description,
            content: CONTENT[name],
            notationId: notations.get(notation)!,
            categoryId: cats.get(cat)!,
            createdById: cataloguer.id,
            keywords: { create: linkKeywords([...keywords]) },
            ...(createdAt && { createdAt }),
          },
        })
      }
    }
  }
  await addComponents(DEMO_COMPONENTS)
  await addComponents(
    STALE_DEMO_COMPONENTS,
    new Date(Date.now() - STALE_DEMO_AGE_DAYS * 86_400_000),
  )
  console.log('Seed complete')
}

main().finally(() => prisma.$disconnect())
