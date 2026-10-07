import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma'
import { CONTENT } from './seed-content'
import { DIAGRAMS } from './seed-diagrams'
import { linkKeywords } from '../src/services/component.service'
import { DEMO_COMPONENTS, NOTATIONS, STALE_DEMO_AGE_DAYS, STALE_DEMO_COMPONENTS } from './seed-data'
import { slugify } from '@sccs/shared'

interface Tree {
  [name: string]: Tree | string
}
/** Nested category tree; a string value marks a leaf design category and names its starter component. */
const TREE: Tree = {
  'Design patterns': {
    UML: {
      Structural: { 'Class Diagram': 'Class diagram starter' },
      Behavioral: {
        'Use Case Diagram': 'Use case diagram starter',
        'Activity Diagram': 'Activity diagram starter',
        'State Machine Diagram': 'State machine diagram starter',
      },
      Interaction: {
        'Sequence Diagram': 'Sequence diagram starter',
        'Communication (Collaboration) Diagram': 'Communication diagram starter',
      },
    },
    ERD: {
      Conceptual: 'Conceptual ERD starter',
      Logical: 'Logical ERD starter',
      Physical: 'Physical ERD starter',
    },
    'Structured Design': {
      'Data Flow Diagrams (DFD)': {
        'Context Diagram (Level 0)': 'Context diagram starter',
        'Level 1 DFD': 'Level 1 DFD starter',
        'Level 2 and Below': 'Level 2 DFD starter',
      },
      'Structure Charts': 'Structure chart starter',
      Flowcharts: 'Flowchart starter',
      'Process Specification Tools': {
        'Decision Tables': 'Decision table starter',
        'Decision Trees': 'Decision tree starter',
      },
      'State Transition Diagrams': 'State transition diagram starter',
    },
  },
  'Data processing': { Parsing: {}, 'Sorting and searching': {} },
  'Web development': { 'UI widgets': {}, Authentication: {} },
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

  const notations = new Map((await prisma.notation.findMany()).map((n) => [n.name, n.id]))
  const cats = new Map<string, string>(
    (await prisma.category.findMany()).map((c) => [c.name, c.id]),
  )
  const notationFor = (path: string[]) =>
    path.includes('Data Flow Diagrams (DFD)')
      ? 'DFD'
      : path[1] === 'Structured Design'
        ? 'Structured Design'
        : path[1]
  /** Create categories recursively; a string leaf also gets its one starter design component. */
  async function walk(tree: Tree, parentId: string | null, path: string[]) {
    for (const [name, sub] of Object.entries(tree)) {
      const cat = await category(name, parentId)
      if (typeof sub === 'string') {
        const found = await prisma.component.findFirst({ where: { name: sub } })
        if (!found)
          await prisma.component.create({
            data: {
              name: sub,
              kind: 'DESIGN',
              description: `Starter template for a ${name} that you can open in the canvas and edit.`,
              content: DIAGRAMS[sub],
              notationId: notations.get(notationFor([...path, name]))!,
              categoryId: cat.id,
              createdById: cataloguer.id,
              keywords: {
                create: linkKeywords([
                  'starter',
                  'template',
                  ...name.toLowerCase().split(/\W+/).filter(Boolean),
                ]),
              },
            },
          })
      } else await walk(sub, cat.id, [...path, name])
    }
  }
  await walk(TREE, null, [])
  cats.clear()
  for (const c of await prisma.category.findMany()) cats.set(c.name, c.id)

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
