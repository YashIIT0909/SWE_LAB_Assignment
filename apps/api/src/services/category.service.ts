import {
  slugify,
  type CategoryNode,
  type CategoryRef,
  type CreateCategoryBody,
  type UpdateCategoryBody,
} from '@sccs/shared'
import { AppError, notFound } from '../errors'
import { prisma } from '../lib/prisma'
import { audit } from './audit.service'

const dto = {
  id: true,
  name: true,
  slug: true,
  description: true,
  parentId: true,
  createdAt: true,
  updatedAt: true,
} as const

/** All ids strictly below `id` in the tree. */
export async function descendantIds(id: string): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    WITH RECURSIVE sub AS (
      SELECT id FROM "Category" WHERE "parentId" = ${id}
      UNION ALL
      SELECT c.id FROM "Category" c JOIN sub ON c."parentId" = sub.id
    )
    SELECT id FROM sub`
  return rows.map((r) => r.id)
}

/** Root first, including the category itself; empty if it does not exist. */
export function breadcrumb(id: string): Promise<CategoryRef[]> {
  return prisma.$queryRaw<CategoryRef[]>`
    WITH RECURSIVE up AS (
      SELECT id, name, slug, "parentId", 0 AS depth FROM "Category" WHERE id = ${id}
      UNION ALL
      SELECT c.id, c.name, c.slug, c."parentId", up.depth + 1
      FROM "Category" c JOIN up ON c.id = up."parentId"
    )
    SELECT id, name, slug FROM up ORDER BY depth DESC`
}

export async function assertExists(id: string, what = 'Category') {
  if (!(await prisma.category.findUnique({ where: { id }, select: { id: true } })))
    throw notFound(what)
}

// ponytail: loads the whole tree in one query; fine for thousands of categories
export async function tree(): Promise<CategoryNode[]> {
  const [cats, counts] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, description: true, parentId: true },
    }),
    prisma.component.groupBy({ by: ['categoryId'], _count: { _all: true } }),
  ])
  const direct = new Map(counts.map((c) => [c.categoryId, c._count._all]))
  const nodes = new Map<string, CategoryNode>(
    cats.map(({ parentId: _p, ...c }) => [
      c.id,
      { ...c, componentCount: direct.get(c.id) ?? 0, totalComponentCount: 0, children: [] },
    ]),
  )
  const roots: CategoryNode[] = []
  for (const c of cats) {
    const node = nodes.get(c.id)!
    const parent = c.parentId ? nodes.get(c.parentId) : undefined
    ;(parent ? parent.children : roots).push(node)
  }
  const total = (n: CategoryNode): number =>
    (n.totalComponentCount = n.componentCount + n.children.reduce((s, ch) => s + total(ch), 0))
  roots.forEach(total)
  return roots
}

export async function get(id: string) {
  const cat = await prisma.category.findUnique({
    where: { id },
    select: {
      ...dto,
      children: {
        orderBy: { name: 'asc' },
        select: { id: true, name: true, slug: true, description: true },
      },
      _count: { select: { components: true } },
    },
  })
  if (!cat) throw notFound('Category')
  const { _count, ...rest } = cat
  return { ...rest, breadcrumb: await breadcrumb(id), componentCount: _count.components }
}

async function assertUniqueName(name: string, parentId: string | null, excludeId?: string) {
  const clash = await prisma.category.findFirst({
    where: {
      parentId,
      name: { equals: name, mode: 'insensitive' },
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  })
  if (clash)
    throw new AppError('DUPLICATE_NAME', 409, `A category named "${name}" already exists here`)
}

export async function create(body: CreateCategoryBody, actorId: string) {
  const parentId = body.parentId ?? null
  if (parentId) await assertExists(parentId, 'Parent category')
  await assertUniqueName(body.name, parentId)
  return prisma.$transaction(async (tx) => {
    const cat = await tx.category.create({
      data: {
        name: body.name,
        slug: slugify(body.name),
        description: body.description || null,
        parentId,
      },
      select: dto,
    })
    await audit(tx, actorId, 'CATEGORY_CREATE', 'Category', cat.id, { name: cat.name, parentId })
    return cat
  })
}

export async function update(id: string, body: UpdateCategoryBody, actorId: string) {
  const current = await prisma.category.findUnique({ where: { id } })
  if (!current) throw notFound('Category')
  const parentId = body.parentId === undefined ? current.parentId : body.parentId
  const name = body.name ?? current.name
  if (body.parentId !== undefined && parentId) {
    await assertExists(parentId, 'Parent category')
    if (parentId === id || (await descendantIds(id)).includes(parentId))
      throw new AppError('CATEGORY_CYCLE', 409, 'A category cannot move under itself')
  }
  await assertUniqueName(name, parentId, id)
  return prisma.$transaction(async (tx) => {
    const cat = await tx.category.update({
      where: { id },
      data: {
        name,
        slug: slugify(name),
        parentId,
        ...(body.description !== undefined ? { description: body.description || null } : {}),
      },
      select: dto,
    })
    await audit(tx, actorId, 'CATEGORY_UPDATE', 'Category', id, body)
    return cat
  })
}

export async function remove(id: string, reassignTo: string | undefined, actorId: string) {
  const cat = await prisma.category.findUnique({
    where: { id },
    select: {
      name: true,
      children: { select: { id: true, name: true } },
      _count: { select: { components: true } },
    },
  })
  if (!cat) throw notFound('Category')
  const empty = cat.children.length === 0 && cat._count.components === 0
  if (!empty) {
    if (!reassignTo)
      throw new AppError(
        'CATEGORY_NOT_EMPTY',
        409,
        'Category has subcategories or components; choose where to move them',
      )
    await assertExists(reassignTo, 'Target category')
    if (reassignTo === id || (await descendantIds(id)).includes(reassignTo))
      throw new AppError('CATEGORY_CYCLE', 409, 'Cannot reassign into the category being deleted')
    for (const child of cat.children) await assertUniqueName(child.name, reassignTo)
  }
  return prisma.$transaction(async (tx) => {
    let movedChildren = 0
    let movedComponents = 0
    if (!empty) {
      movedChildren = (
        await tx.category.updateMany({ where: { parentId: id }, data: { parentId: reassignTo } })
      ).count
      movedComponents = (
        await tx.component.updateMany({
          where: { categoryId: id },
          data: { categoryId: reassignTo },
        })
      ).count
    }
    await tx.category.delete({ where: { id } })
    await audit(tx, actorId, 'CATEGORY_DELETE', 'Category', id, {
      name: cat.name,
      reassignTo: empty ? null : reassignTo!,
      movedChildren,
      movedComponents,
    })
    return {
      deletedId: id,
      movedComponents,
      movedChildren,
      reassignedTo: empty ? null : reassignTo!,
    }
  })
}
