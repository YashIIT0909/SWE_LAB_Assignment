import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { app } from '../src/app'
import { createUser, makeCategory, makeComponent, prisma, resetDb, seedNotations } from './helpers'

const api = '/api/v1'
let cat: Awaited<ReturnType<typeof createUser>>
let notations: Awaited<ReturnType<typeof seedNotations>>

beforeEach(async () => {
  await resetDb()
  notations = await seedNotations()
  cat = await createUser('CATALOGUER')
})

/** root > mid > leaf, plus other root */
async function threeLevels() {
  const root = await makeCategory('Root')
  const mid = await makeCategory('Mid', root.id)
  const leaf = await makeCategory('Leaf', mid.id)
  const other = await makeCategory('Other')
  return { root, mid, leaf, other }
}

const comp = (categoryId: string) =>
  makeComponent({ categoryId, notationId: notations.UML.id, createdById: cat.user.id })

describe('notations', () => {
  it('T-14 seeded notations by kind', async () => {
    const all = await request(app).get(`${api}/notations`)
    expect(all.body.items).toHaveLength(10)
    const design = await request(app).get(`${api}/notations?kind=DESIGN`)
    expect(design.body.items.map((n: { name: string }) => n.name).sort()).toEqual([
      'DFD',
      'ERD',
      'Structured Design',
      'UML',
    ])
    const code = await request(app).get(`${api}/notations?kind=CODE`)
    expect(code.body.items).toHaveLength(6)
    expect((await request(app).get(`${api}/notations?kind=BAD`)).status).toBe(400)
  })

  it('T-15 create notation; duplicate name case-insensitive', async () => {
    const ok = await request(app)
      .post(`${api}/notations`)
      .set(cat.auth)
      .send({ name: 'Rust', kind: 'CODE' })
    expect(ok.status).toBe(201)
    expect(ok.body).toMatchObject({ name: 'Rust', kind: 'CODE' })
    const dup = await request(app)
      .post(`${api}/notations`)
      .set(cat.auth)
      .send({ name: 'uml', kind: 'DESIGN' })
    expect(dup.status).toBe(409)
    expect(dup.body.error.code).toBe('DUPLICATE_NAME')
    expect(await prisma.auditLog.count({ where: { action: 'NOTATION_CREATE' } })).toBe(1)
  })
})

describe('categories read', () => {
  it('T-28 tree nests three levels with direct and total counts', async () => {
    const { root, mid, leaf } = await threeLevels()
    await comp(mid.id)
    await comp(leaf.id)
    await comp(leaf.id)
    const res = await request(app).get(`${api}/categories/tree`)
    expect(res.status).toBe(200)
    expect(res.body.items.map((n: { name: string }) => n.name)).toEqual(['Other', 'Root'])
    const r = res.body.items[1]
    expect(r).toMatchObject({ id: root.id, componentCount: 0, totalComponentCount: 3 })
    expect(r.children[0]).toMatchObject({ id: mid.id, componentCount: 1, totalComponentCount: 3 })
    expect(r.children[0].children[0]).toMatchObject({
      id: leaf.id,
      componentCount: 2,
      totalComponentCount: 2,
      children: [],
    })
  })

  it('T-29 detail of level-3 node has root-first breadcrumb; unknown id 404', async () => {
    const { root, mid, leaf } = await threeLevels()
    const res = await request(app).get(`${api}/categories/${mid.id}`)
    expect(res.status).toBe(200)
    expect(res.body.children.map((c: { id: string }) => c.id)).toEqual([leaf.id])
    const deep = await request(app).get(`${api}/categories/${leaf.id}`)
    expect(deep.body.breadcrumb.map((b: { id: string }) => b.id)).toEqual([
      root.id,
      mid.id,
      leaf.id,
    ])
    expect(deep.body.componentCount).toBe(0)
    const missing = await request(app).get(`${api}/categories/nope`)
    expect(missing.status).toBe(404)
    expect(missing.body.error.code).toBe('NOT_FOUND')
  })
})

describe('categories write', () => {
  it('T-31 duplicate sibling names under parent and at root; same name elsewhere ok', async () => {
    const { root, other } = await threeLevels()
    const post = (body: object) => request(app).post(`${api}/categories`).set(cat.auth).send(body)
    expect((await post({ name: 'mid', parentId: root.id })).status).toBe(409)
    expect((await post({ name: 'Root' })).status).toBe(409)
    const ok = await post({ name: 'Mid', parentId: other.id, description: 'x' })
    expect(ok.status).toBe(201)
    expect(ok.body).toMatchObject({
      name: 'Mid',
      slug: 'mid',
      parentId: other.id,
      description: 'x',
    })
    expect((await post({ name: 'X', parentId: 'nope' })).status).toBe(404)
    expect(await prisma.auditLog.count({ where: { action: 'CATEGORY_CREATE' } })).toBe(1)
  })

  it('T-32 move under itself or grandchild is a cycle; under unrelated node ok', async () => {
    const { root, leaf, other } = await threeLevels()
    const patch = (id: string, body: object) =>
      request(app).patch(`${api}/categories/${id}`).set(cat.auth).send(body)
    for (const parentId of [root.id, leaf.id]) {
      const res = await patch(root.id, { parentId })
      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('CATEGORY_CYCLE')
    }
    const ok = await patch(root.id, { parentId: other.id, name: 'Moved' })
    expect(ok.status).toBe(200)
    expect(ok.body).toMatchObject({ parentId: other.id, name: 'Moved', slug: 'moved' })
    const back = await patch(root.id, { parentId: null })
    expect(back.body.parentId).toBeNull()
    expect((await patch(root.id, {})).status).toBe(400)
    expect((await patch('nope', { name: 'x' })).status).toBe(404)
  })

  it('T-33 delete empty; non-empty without target; with target; into own subtree', async () => {
    const { root, mid, leaf, other } = await threeLevels()
    const del = (id: string, q = '') =>
      request(app).delete(`${api}/categories/${id}${q}`).set(cat.auth)

    const empty = await del(leaf.id)
    expect(empty.status).toBe(200)
    expect(empty.body).toEqual({
      deletedId: leaf.id,
      movedComponents: 0,
      movedChildren: 0,
      reassignedTo: null,
    })

    await comp(root.id)
    const blocked = await del(root.id)
    expect(blocked.status).toBe(409)
    expect(blocked.body.error.code).toBe('CATEGORY_NOT_EMPTY')

    const cyc = await del(root.id, `?reassignTo=${mid.id}`)
    expect(cyc.status).toBe(409)
    expect(cyc.body.error.code).toBe('CATEGORY_CYCLE')

    const moved = await del(root.id, `?reassignTo=${other.id}`)
    expect(moved.status).toBe(200)
    expect(moved.body).toEqual({
      deletedId: root.id,
      movedComponents: 1,
      movedChildren: 1,
      reassignedTo: other.id,
    })
    expect((await prisma.category.findUniqueOrThrow({ where: { id: mid.id } })).parentId).toBe(
      other.id,
    )
    expect(await prisma.auditLog.count({ where: { action: 'CATEGORY_DELETE' } })).toBe(2)
  })

  it('delete reassign rejects child name clash under target', async () => {
    const a = await makeCategory('A')
    const b = await makeCategory('B')
    await makeCategory('Same', a.id)
    await makeCategory('Same', b.id)
    const res = await request(app)
      .delete(`${api}/categories/${a.id}?reassignTo=${b.id}`)
      .set(cat.auth)
    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('DUPLICATE_NAME')
  })

  it('category writes need a cataloguer', async () => {
    const user = await createUser('USER')
    expect((await request(app).post(`${api}/categories`).send({ name: 'x' })).status).toBe(401)
    expect(
      (await request(app).post(`${api}/categories`).set(user.auth).send({ name: 'x' })).status,
    ).toBe(403)
  })
})
