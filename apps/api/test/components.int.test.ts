import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { app } from '../src/app'
import { createUser, makeCategory, makeComponent, prisma, resetDb, seedNotations } from './helpers'

const api = '/api/v1'
let cat: Awaited<ReturnType<typeof createUser>>
let n: Awaited<ReturnType<typeof seedNotations>>
let leaf: { id: string }

beforeEach(async () => {
  await resetDb()
  n = await seedNotations()
  cat = await createUser('CATALOGUER')
  leaf = await makeCategory('Leaf')
})

const body = (over: object = {}) => ({
  name: 'Observer pattern class diagram',
  description: 'UML class diagram of the Observer pattern',
  kind: 'DESIGN',
  notationId: n.UML.id,
  categoryId: leaf.id,
  keywords: [' Observer', 'EVENT', 'observer'],
  ...over,
})
const post = (b: object) => request(app).post(`${api}/components`).set(cat.auth).send(b)

describe('component create', () => {
  it('T-07 create DESIGN component with UML and keywords', async () => {
    const res = await post(body({ useCount: 50 }))
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      kind: 'DESIGN',
      version: '1.0.0',
      useCount: 0,
      queryHitCount: 0,
      queryHitNotUsedCount: 0,
      notation: { name: 'UML' },
      createdBy: { id: cat.user.id },
    })
    expect(res.body.keywords.map((k: { term: string }) => k.term)).toEqual(['event', 'observer'])
    const log = await prisma.auditLog.findMany({ where: { action: 'COMPONENT_CREATE' } })
    expect(log).toHaveLength(1)
    expect(log[0].entityId).toBe(res.body.id)
  })

  it('T-08 CODE component with UML notation is NOTATION_KIND_MISMATCH and writes nothing', async () => {
    const res = await post(body({ kind: 'CODE' }))
    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('NOTATION_KIND_MISMATCH')
    expect(await prisma.component.count()).toBe(0)
    expect(await prisma.keyword.count()).toBe(0)
  })

  it('T-09 validation boundaries', async () => {
    expect((await post(body({ name: 'x'.repeat(120) }))).status).toBe(201)
    for (const bad of [
      body({ name: undefined }),
      body({ name: 'x'.repeat(121) }),
      body({ sourceUrl: 'not a url' }),
      body({ sourceUrl: 'javascript:alert(1)' }),
      body({ kind: 'DIAGRAM' }),
    ]) {
      const res = await post(bad)
      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    }
    expect((await post(body({ notationId: 'nope' }))).status).toBe(404)
    expect((await post(body({ categoryId: 'nope' }))).status).toBe(404)
  })
})

describe('component update and delete', () => {
  it('T-10 patch description; patch kind to mismatch; unknown id', async () => {
    const { body: c } = await post(body())
    const patch = (id: string, b: object) =>
      request(app).patch(`${api}/components/${id}`).set(cat.auth).send(b)
    const ok = await patch(c.id, { description: 'new', author: null })
    expect(ok.status).toBe(200)
    expect(ok.body.description).toBe('new')
    expect((await patch(c.id, { kind: 'CODE' })).status).toBe(422)
    const both = await patch(c.id, { kind: 'CODE', notationId: n.Python.id })
    expect(both.status).toBe(200)
    expect(both.body.notation.name).toBe('Python')
    expect((await patch(c.id, { notationId: n.UML.id })).status).toBe(422)
    expect((await patch('nope', { name: 'x' })).status).toBe(404)
    expect((await patch(c.id, {})).status).toBe(400)
    expect(await prisma.auditLog.count({ where: { action: 'COMPONENT_UPDATE' } })).toBe(2)
  })

  it('T-11 delete cascades links, results and events but keeps keywords', async () => {
    const { body: c } = await post(body())
    const q = await prisma.searchQuery.create({
      data: { terms: ['observer'], filters: {}, resultCount: 1 },
    })
    await prisma.searchResult.create({ data: { queryId: q.id, componentId: c.id, rank: 1 } })
    await prisma.usageEvent.create({ data: { componentId: c.id, userId: cat.user.id } })
    const res = await request(app).delete(`${api}/components/${c.id}`).set(cat.auth)
    expect(res.status).toBe(204)
    expect(await prisma.componentKeyword.count()).toBe(0)
    expect(await prisma.searchResult.count()).toBe(0)
    expect(await prisma.usageEvent.count()).toBe(0)
    expect(await prisma.keyword.count()).toBe(2)
    expect(
      await prisma.auditLog.findFirst({ where: { action: 'COMPONENT_DELETE' } }),
    ).toMatchObject({
      entityId: c.id,
      details: { name: c.name },
    })
    expect((await request(app).delete(`${api}/components/${c.id}`).set(cat.auth)).status).toBe(404)
  })
})

describe('keywords', () => {
  it('T-12 PUT normalises, empty clears, 51 chars rejected', async () => {
    const { body: c } = await post(body({ keywords: [] }))
    const put = (keywords: unknown) =>
      request(app).put(`${api}/components/${c.id}/keywords`).set(cat.auth).send({ keywords })
    const res = await put([' CSV', 'csv', 'Parser'])
    expect(res.status).toBe(200)
    expect(res.body.keywords.map((k: { term: string }) => k.term)).toEqual(['csv', 'parser'])
    expect((await put([])).body.keywords).toEqual([])
    expect((await put(['x'.repeat(51)])).status).toBe(400)
    expect(
      (
        await request(app)
          .put(`${api}/components/nope/keywords`)
          .set(cat.auth)
          .send({ keywords: [] })
      ).status,
    ).toBe(404)
  })

  it('T-13 POST reuses keywords; DELETE linked and unlinked', async () => {
    const { body: c } = await post(body({ keywords: ['csv'] }))
    const other = await post(body({ name: 'other', keywords: ['parser'] }))
    const add = await request(app)
      .post(`${api}/components/${c.id}/keywords`)
      .set(cat.auth)
      .send({ keywords: ['CSV', 'parser', 'rfc4180'] })
    expect(add.body.keywords.map((k: { term: string }) => k.term)).toEqual([
      'csv',
      'parser',
      'rfc4180',
    ])
    expect(await prisma.keyword.count()).toBe(3)
    const parserId = other.body.keywords[0].id
    const del = await request(app)
      .delete(`${api}/components/${c.id}/keywords/${parserId}`)
      .set(cat.auth)
    expect(del.status).toBe(200)
    expect(del.body.keywords.map((k: { term: string }) => k.term)).toEqual(['csv', 'rfc4180'])
    expect(await prisma.keyword.count()).toBe(3)
    const again = await request(app)
      .delete(`${api}/components/${c.id}/keywords/${parserId}`)
      .set(cat.auth)
    expect(again.status).toBe(404)
    expect(await prisma.auditLog.count({ where: { action: 'KEYWORDS_UPDATE' } })).toBe(2)
  })

  it('T-35 autocomplete by prefix, limit bounds, empty prefix = most used', async () => {
    await post(body({ keywords: ['csv', 'css'] }))
    await post(body({ name: 'b', keywords: ['csv'] }))
    const get = (qs: string) => request(app).get(`${api}/keywords?${qs}`)
    const one = await get('prefix=CS&limit=1')
    expect(one.body.items).toEqual([{ id: expect.any(String), term: 'csv', componentCount: 2 }])
    expect((await get('prefix=cs&limit=50')).body.items).toHaveLength(2)
    expect((await get('limit=51')).status).toBe(400)
    expect((await get('')).body.items.map((k: { term: string }) => k.term)).toEqual(['csv', 'css'])
  })
})

describe('component reads', () => {
  it('T-46 detail with content, notation, breadcrumb, keywords, createdBy; unknown 404', async () => {
    const child = await makeCategory('Child', leaf.id)
    const { body: c } = await post(body({ categoryId: child.id, content: '@startuml' }))
    const res = await request(app).get(`${api}/components/${c.id}`)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      content: '@startuml',
      notation: { name: 'UML', kind: 'DESIGN' },
      category: { id: child.id, breadcrumb: [{ id: leaf.id }, { id: child.id }] },
      createdBy: { id: cat.user.id, name: cat.user.name },
    })
    expect(res.body).not.toHaveProperty('createdById')
    expect((await request(app).get(`${api}/components/nope`)).status).toBe(404)
  })

  it('T-30 category components with includeDescendants and each sort; counters untouched', async () => {
    const child = await makeCategory('Child', leaf.id)
    const mk = (name: string, categoryId: string, useCount: number, createdAt: Date) =>
      makeComponent({
        name,
        categoryId,
        notationId: n.UML.id,
        createdById: cat.user.id,
        useCount,
        createdAt,
      })
    await mk('Bravo', leaf.id, 5, new Date('2026-01-02'))
    await mk('Alpha', leaf.id, 1, new Date('2026-01-03'))
    await mk('Charlie', child.id, 9, new Date('2026-01-01'))
    const names = async (qs: string) =>
      (await request(app).get(`${api}/categories/${leaf.id}/components?${qs}`)).body.items.map(
        (c: { name: string }) => c.name,
      )
    expect(await names('')).toEqual(['Alpha', 'Bravo'])
    expect(await names('includeDescendants=true')).toEqual(['Alpha', 'Bravo', 'Charlie'])
    expect(await names('includeDescendants=true&sort=mostUsed')).toEqual([
      'Charlie',
      'Bravo',
      'Alpha',
    ])
    expect(await names('includeDescendants=true&sort=newest')).toEqual([
      'Alpha',
      'Bravo',
      'Charlie',
    ])
    expect((await request(app).get(`${api}/categories/nope/components`)).status).toBe(404)
    const counters = await prisma.component.aggregate({ _sum: { queryHitCount: true } })
    expect(counters._sum.queryHitCount).toBe(0)
  })

  it('T-34 list filters by kind, notation, category and q without recording a search', async () => {
    const other = await makeCategory('Other')
    await post(body({ name: 'Observer diagram' }))
    await post(
      body({
        name: 'CSV parser',
        kind: 'CODE',
        notationId: n.Python.id,
        description: 'Parses CSV',
      }),
    )
    await post(
      body({
        name: 'ER model',
        description: 'Entity model',
        notationId: n.ERD.id,
        categoryId: other.id,
      }),
    )
    const names = async (qs: string) =>
      (await request(app).get(`${api}/components?${qs}`)).body.items.map(
        (c: { name: string }) => c.name,
      )
    expect(await names('kind=CODE')).toEqual(['CSV parser'])
    expect(await names(`notationId=${n.ERD.id}`)).toEqual(['ER model'])
    expect(await names(`categoryId=${other.id}`)).toEqual(['ER model'])
    expect(await names('q=parses')).toEqual(['CSV parser'])
    expect(await names('q=OBSERVER')).toEqual(['Observer diagram'])
    expect((await request(app).get(`${api}/components?categoryId=nope`)).status).toBe(404)
    expect(await prisma.searchQuery.count()).toBe(0)
  })

  it('T-27 pagination boundaries on list', async () => {
    for (let i = 0; i < 3; i++)
      await makeComponent({ categoryId: leaf.id, notationId: n.UML.id, createdById: cat.user.id })
    const get = (qs: string) => request(app).get(`${api}/components?${qs}`)
    for (const qs of ['page=0', 'pageSize=0', 'pageSize=51', 'page=abc'])
      expect((await get(qs)).status).toBe(400)
    expect((await get('pageSize=1')).body).toMatchObject({ page: 1, pageSize: 1, total: 3 })
    expect((await get('pageSize=50')).body.items).toHaveLength(3)
    expect((await get('pageSize=2&page=2')).body.items).toHaveLength(1)
    expect((await get('pageSize=2&page=3')).body).toMatchObject({ items: [], total: 3 })
  })
})

describe('access control', () => {
  it('T-06 USER gets FORBIDDEN and anonymous gets UNAUTHENTICATED on cataloguer endpoints', async () => {
    const user = await createUser('USER')
    const endpoints: [string, string][] = [
      ['post', '/categories'],
      ['patch', '/categories/x'],
      ['delete', '/categories/x'],
      ['post', '/notations'],
      ['post', '/components'],
      ['patch', '/components/x'],
      ['delete', '/components/x'],
      ['put', '/components/x/keywords'],
      ['post', '/components/x/keywords'],
      ['delete', '/components/x/keywords/y'],
    ]
    for (const [method, path] of endpoints) {
      const anon = await request(app)[method as 'post'](`${api}${path}`).send({})
      expect(anon.status, `${method} ${path}`).toBe(401)
      expect(anon.body.error.code).toBe('UNAUTHENTICATED')
      const res = await request(app)[method as 'post'](`${api}${path}`).set(user.auth).send({})
      expect(res.status, `${method} ${path}`).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    }
  })
})
