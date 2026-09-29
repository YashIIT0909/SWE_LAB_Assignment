import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { app } from '../src/app'
import { createUser, makeCategory, makeComponent, prisma, resetDb, seedNotations } from './helpers'

const api = '/api/v1'
const DAY = 86_400_000
const MIN = 60_000
let cat: Awaited<ReturnType<typeof createUser>>
let n: Awaited<ReturnType<typeof seedNotations>>
let leaf: { id: string }

beforeEach(async () => {
  await resetDb()
  n = await seedNotations()
  cat = await createUser('CATALOGUER')
  leaf = await makeCategory('Leaf')
})

const ago = (ms: number) => new Date(Date.now() - ms)
const mk = (name: string, over: object = {}) =>
  makeComponent({
    name,
    categoryId: leaf.id,
    notationId: n.UML.id,
    createdById: cat.user.id,
    createdAt: ago(365 * DAY),
    ...over,
  })
const get = (path: string) => request(app).get(`${api}${path}`).set(cat.auth)

describe('summary', () => {
  it('T-36 summary on empty catalogue and on data', async () => {
    const empty = await get('/reports/summary')
    expect(empty.status).toBe(200)
    expect(empty.body.totals).toEqual({
      components: 0,
      design: 0,
      code: 0,
      categories: 1,
      keywords: 0,
      searches: 0,
      uses: 0,
    })
    expect(empty.body).toMatchObject({ topUsed: [], topNotUsed: [], neverUsedCount: 0 })

    for (let i = 0; i < 12; i++)
      await mk(`U${String(i).padStart(2, '0')}`, { useCount: i + 1, keywords: [`k${i}`] })
    await mk('Code', { kind: 'CODE', notationId: n.Python.id, queryHitNotUsedCount: 7 })
    await prisma.searchQuery.create({ data: { terms: ['x'], filters: {}, resultCount: 0 } })
    const res = await get('/reports/summary')
    expect(res.body.totals).toEqual({
      components: 13,
      design: 12,
      code: 1,
      categories: 1,
      keywords: 12,
      searches: 1,
      uses: 0,
    })
    expect(res.body.topUsed).toHaveLength(10)
    expect(res.body.topUsed[0]).toEqual({ id: expect.any(String), name: 'U11', useCount: 12 })
    expect(res.body.topNotUsed).toEqual([
      { id: expect.any(String), name: 'Code', queryHitNotUsedCount: 7, useCount: 0 },
    ])
    expect(res.body.neverUsedCount).toBe(1)
    const uml = res.body.byNotation.find((b: { name: string }) => b.name === 'UML')
    expect(uml).toMatchObject({ kind: 'DESIGN', components: 12 })
  })
})

describe('purge candidates', () => {
  it('T-37 each threshold is inclusive at the boundary and exclusive one step past', async () => {
    const p = { maxUses: 2, minNotUsedHits: 3, unusedForDays: 90, olderThanDays: 30 }
    const base = {
      useCount: 2,
      queryHitNotUsedCount: 3,
      lastUsedAt: ago(90 * DAY + MIN),
      createdAt: ago(30 * DAY + MIN),
    }
    await mk('in-all-boundaries', base)
    await mk('in-never-used', { ...base, lastUsedAt: null })
    await mk('out-uses', { ...base, useCount: 3 })
    await mk('out-hits', { ...base, queryHitNotUsedCount: 2 })
    await mk('out-recent-use', { ...base, lastUsedAt: ago(90 * DAY - MIN) })
    await mk('out-too-new', { ...base, createdAt: ago(30 * DAY - MIN) })
    const qs = new URLSearchParams(Object.entries(p).map(([k, v]) => [k, String(v)]))
    const res = await get(`/reports/purge-candidates?${qs}`)
    expect(res.status).toBe(200)
    expect(res.body.params).toEqual(p)
    expect(res.body.items.map((c: { name: string }) => c.name).sort()).toEqual([
      'in-all-boundaries',
      'in-never-used',
    ])
    expect(res.body.total).toBe(2)
  })

  it('defaults apply and negative params are rejected', async () => {
    await mk('old-unused')
    await mk('new-unused', { createdAt: new Date() })
    await mk('used', { useCount: 1 })
    const res = await get('/reports/purge-candidates')
    expect(res.body.params).toEqual({
      maxUses: 0,
      minNotUsedHits: 0,
      unusedForDays: 90,
      olderThanDays: 30,
    })
    expect(res.body.items.map((c: { name: string }) => c.name)).toEqual(['old-unused'])
    expect((await get('/reports/purge-candidates?maxUses=-1')).status).toBe(400)
  })

  it('T-38 purge re-checks criteria: used-since and unknown ids are skipped', async () => {
    const a = await mk('A')
    const b = await mk('B')
    await prisma.component.update({
      where: { id: b.id },
      data: { useCount: 1, lastUsedAt: new Date() },
    })
    const res = await request(app)
      .post(`${api}/reports/purge`)
      .set(cat.auth)
      .send({ componentIds: [a.id, b.id, 'ghost'] })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      deleted: [a.id],
      skipped: [
        { id: b.id, reason: 'NO_LONGER_CANDIDATE' },
        { id: 'ghost', reason: 'NOT_FOUND' },
      ],
    })
    expect(await prisma.component.findUnique({ where: { id: a.id } })).toBeNull()
    const log = await prisma.auditLog.findFirstOrThrow({ where: { action: 'COMPONENT_PURGE' } })
    expect(log).toMatchObject({
      entityId: a.id,
      details: { name: 'A', useCount: 0, params: { maxUses: 0 } },
    })
    expect(
      (await request(app).post(`${api}/reports/purge`).set(cat.auth).send({ componentIds: [] }))
        .status,
    ).toBe(400)
  })
})

describe('audit', () => {
  it('T-39 one row per write, newest first, filters work', async () => {
    const post = (path: string, body: object) =>
      request(app).post(`${api}${path}`).set(cat.auth).send(body)
    const c1 = await post('/categories', { name: 'Audit cat' })
    await request(app)
      .patch(`${api}/categories/${c1.body.id}`)
      .set(cat.auth)
      .send({ description: 'd' })
    await post('/notations', { name: 'Rust', kind: 'CODE' })
    const comp = await post('/components', {
      name: 'X',
      description: 'x',
      kind: 'DESIGN',
      notationId: n.UML.id,
      categoryId: leaf.id,
    })
    await request(app)
      .patch(`${api}/components/${comp.body.id}`)
      .set(cat.auth)
      .send({ version: '2' })
    await request(app)
      .put(`${api}/components/${comp.body.id}/keywords`)
      .set(cat.auth)
      .send({ keywords: ['a'] })
    await request(app).delete(`${api}/components/${comp.body.id}`).set(cat.auth)
    await request(app).delete(`${api}/categories/${c1.body.id}`).set(cat.auth)

    const res = await get('/reports/audit')
    expect(res.body.total).toBe(8)
    expect(res.body.items.map((i: { action: string }) => i.action)).toEqual([
      'CATEGORY_DELETE',
      'COMPONENT_DELETE',
      'KEYWORDS_UPDATE',
      'COMPONENT_UPDATE',
      'COMPONENT_CREATE',
      'NOTATION_CREATE',
      'CATEGORY_UPDATE',
      'CATEGORY_CREATE',
    ])
    expect(res.body.items[0].actor).toEqual({ id: cat.user.id, name: cat.user.name })
    const filtered = await get('/reports/audit?entityType=Category&pageSize=2')
    expect(filtered.body).toMatchObject({ total: 3, pageSize: 2 })
    expect((await get('/reports/audit?action=NOTATION_CREATE')).body.total).toBe(1)
    expect((await get('/reports/audit?action=NOPE')).status).toBe(400)
  })

  it('T-06 report endpoints need a cataloguer', async () => {
    const user = await createUser('USER')
    for (const [m, path] of [
      ['get', '/reports/summary'],
      ['get', '/reports/purge-candidates'],
      ['post', '/reports/purge'],
      ['get', '/reports/audit'],
    ] as const) {
      expect((await request(app)[m](`${api}${path}`)).status).toBe(401)
      expect((await request(app)[m](`${api}${path}`).set(user.auth)).status).toBe(403)
    }
  })
})
