import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { app } from '../src/app'
import { createUser, makeCategory, makeComponent, prisma, resetDb, seedNotations } from './helpers'

const api = '/api/v1'
let cat: Awaited<ReturnType<typeof createUser>>
let user: Awaited<ReturnType<typeof createUser>>
let n: Awaited<ReturnType<typeof seedNotations>>
let root: { id: string }
let child: { id: string }

beforeEach(async () => {
  await resetDb()
  n = await seedNotations()
  cat = await createUser('CATALOGUER')
  user = await createUser('USER')
  root = await makeCategory('Root')
  child = await makeCategory('Child', root.id)
})
afterEach(() => {
  vi.restoreAllMocks()
})

const mk = (name: string, keywords: string[], over: object = {}) =>
  makeComponent({
    name,
    keywords,
    categoryId: root.id,
    notationId: n.UML.id,
    createdById: cat.user.id,
    ...over,
  })
const search = (body: object, auth: Record<string, string> = {}) =>
  request(app)
    .post(`${api}/search`)
    .set(auth)
    .send({ match: 'any', ...body })
const use = (id: string, body: object = {}, auth: Record<string, string> = user.auth) =>
  request(app).post(`${api}/components/${id}/use`).set(auth).send(body)
const counters = (id: string) =>
  prisma.component.findUniqueOrThrow({
    where: { id },
    select: { useCount: true, queryHitCount: true, queryHitNotUsedCount: true, lastUsedAt: true },
  })

describe('search', () => {
  it('T-16 exact vs prefix vs short term through the API', async () => {
    const a = await mk('A', ['parser'])
    const b = await mk('B', ['parsers'])
    const exact = await search({ keywords: ['Parser'] })
    expect(exact.status).toBe(200)
    expect(exact.body.items.map((i: { id: string; score: number }) => [i.id, i.score])).toEqual([
      [a.id, 2],
      [b.id, 1],
    ])
    expect(exact.body.items[0]).toMatchObject({
      matchedKeywords: ['parser'],
      notation: { name: 'UML' },
    })
    expect((await search({ keywords: ['par'] })).body.total).toBe(2)
    expect((await search({ keywords: ['pa'] })).body.total).toBe(0)
  })

  it('T-17 match all vs any', async () => {
    await mk('Both', ['csv', 'xml'])
    await mk('Csv', ['csv'])
    await mk('Xml', ['xml'])
    const names = async (match: string) =>
      (await search({ keywords: ['csv', 'xml'], match })).body.items.map(
        (i: { name: string }) => i.name,
      )
    expect(await names('all')).toEqual(['Both'])
    expect(await names('any')).toEqual(['Both', 'Csv', 'Xml'])
  })

  it('T-19 filters kind, notation, category with and without descendants', async () => {
    await mk('Design root', ['csv'])
    await mk('Code child', ['csv'], { kind: 'CODE', notationId: n.Python.id, categoryId: child.id })
    const names = async (f: object) =>
      (await search({ keywords: ['csv'], ...f })).body.items.map((i: { name: string }) => i.name)
    expect(await names({ kind: 'CODE' })).toEqual(['Code child'])
    expect(await names({ notationId: n.UML.id })).toEqual(['Design root'])
    expect(await names({ categoryId: root.id })).toEqual(['Design root'])
    expect(await names({ categoryId: root.id, includeDescendants: true })).toEqual([
      'Code child',
      'Design root',
    ])
    expect((await search({ keywords: ['csv'], notationId: 'nope' })).status).toBe(404)
    expect((await search({ keywords: ['csv'], categoryId: 'nope' })).status).toBe(404)
  })

  it('T-20 term count and length boundaries; match required', async () => {
    const terms = (k: number) => Array.from({ length: k }, (_, i) => `t${i}`)
    expect((await search({ keywords: [] })).status).toBe(400)
    expect((await search({ keywords: terms(1) })).status).toBe(200)
    expect((await search({ keywords: terms(10) })).status).toBe(200)
    expect((await search({ keywords: terms(11) })).status).toBe(400)
    expect((await search({ keywords: [''] })).status).toBe(400)
    expect((await search({ keywords: [' '] })).status).toBe(400)
    expect((await search({ keywords: ['x'] })).status).toBe(200)
    expect((await search({ keywords: ['x'.repeat(50)] })).status).toBe(200)
    expect((await search({ keywords: ['x'.repeat(51)] })).status).toBe(400)
    expect(
      (
        await request(app)
          .post(`${api}/search`)
          .send({ keywords: ['x'] })
      ).status,
    ).toBe(400)
    expect((await search({ keywords: ['x'], match: 'ALL' })).status).toBe(400)
    expect((await search({ keywords: 'x' })).status).toBe(400)
  })

  it('T-21 only returned page gets hit counters and SearchResult rows', async () => {
    for (let i = 0; i < 25; i++) await mk(`C${String(i).padStart(2, '0')}`, ['csv'])
    const res = await search({ keywords: ['csv'], page: 2, pageSize: 20 }, user.auth)
    expect(res.body).toMatchObject({ page: 2, pageSize: 20, total: 25 })
    expect(res.body.items).toHaveLength(5)
    const q = await prisma.searchQuery.findUniqueOrThrow({
      where: { id: res.body.queryId },
      include: { results: { orderBy: { rank: 'asc' } } },
    })
    expect(q).toMatchObject({ resultCount: 25, userId: user.user.id, terms: ['csv'] })
    expect(q.results.map((r) => r.rank)).toEqual([21, 22, 23, 24, 25])
    const hit = await prisma.component.findMany({
      where: { queryHitCount: 1, queryHitNotUsedCount: 1 },
    })
    expect(hit.map((c) => c.id).sort()).toEqual(q.results.map((r) => r.componentId).sort())
    expect(await prisma.component.count({ where: { queryHitCount: 0 } })).toBe(20)
  })

  it('T-27 search pagination boundaries', async () => {
    for (let i = 0; i < 3; i++) await mk(`C${i}`, ['csv'])
    for (const b of [{ page: 0 }, { pageSize: 0 }, { pageSize: 51 }])
      expect((await search({ keywords: ['csv'], ...b })).status).toBe(400)
    expect((await search({ keywords: ['csv'], pageSize: 1 })).body.items).toHaveLength(1)
    expect((await search({ keywords: ['csv'], pageSize: 50 })).body.items).toHaveLength(3)
    const past = await search({ keywords: ['csv'], page: 2, pageSize: 50 })
    expect(past.body).toMatchObject({ items: [], total: 3 })
  })
})

describe('use', () => {
  it('T-22 use with a queryId whose result is unused', async () => {
    const c = await mk('A', ['csv'])
    const { body } = await search({ keywords: ['csv'] })
    const res = await use(c.id, { queryId: body.queryId })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      componentId: c.id,
      useCount: 1,
      queryHitCount: 1,
      queryHitNotUsedCount: 0,
      countedQueryHit: true,
    })
    expect(res.body.lastUsedAt).toEqual(expect.any(String))
    const r = await prisma.searchResult.findFirstOrThrow({ where: { queryId: body.queryId } })
    expect(r.used).toBe(true)
    expect(await prisma.usageEvent.findFirst()).toMatchObject({
      componentId: c.id,
      userId: user.user.id,
      queryId: body.queryId,
    })
  })

  it('T-23 using twice with the same queryId counts the hit once', async () => {
    const c = await mk('A', ['csv'])
    const { body } = await search({ keywords: ['csv'] })
    await use(c.id, { queryId: body.queryId })
    const second = await use(c.id, { queryId: body.queryId })
    expect(second.body).toMatchObject({
      useCount: 2,
      queryHitNotUsedCount: 0,
      countedQueryHit: false,
    })
  })

  it('T-24 plain use; unknown queryId; notUsed already 0', async () => {
    const c = await mk('A', ['csv'])
    const plain = await request(app).post(`${api}/components/${c.id}/use`).set(user.auth)
    expect(plain.body).toMatchObject({
      useCount: 1,
      queryHitNotUsedCount: 0,
      countedQueryHit: false,
    })
    const unknown = await use(c.id, { queryId: 'nope' })
    expect(unknown.status).toBe(200)
    expect(unknown.body).toMatchObject({ useCount: 2, countedQueryHit: false })
    expect(await prisma.usageEvent.count({ where: { queryId: null } })).toBe(2)

    const { body } = await search({ keywords: ['csv'] })
    await prisma.component.update({ where: { id: c.id }, data: { queryHitNotUsedCount: 0 } })
    const drift = await use(c.id, { queryId: body.queryId })
    expect(drift.body).toMatchObject({
      useCount: 3,
      queryHitNotUsedCount: 0,
      countedQueryHit: true,
    })

    const other = await mk('B', ['xml'])
    const notReturned = await use(other.id, { queryId: body.queryId })
    expect(notReturned.body).toMatchObject({ useCount: 1, countedQueryHit: false })
  })

  it('T-25 use without token; unknown component', async () => {
    const c = await mk('A', ['csv'])
    expect((await use(c.id, {}, {})).status).toBe(401)
    expect((await use('nope')).status).toBe(404)
    expect((await counters(c.id)).useCount).toBe(0)
  })
})

describe('transactions', () => {
  /** Makes tx.component[method] throw inside every interactive transaction. */
  function failInTx(method: 'update' | 'updateMany') {
    const original = prisma.$transaction.bind(prisma) as (fn: (tx: unknown) => unknown) => unknown
    vi.spyOn(prisma, '$transaction').mockImplementation(((fn: (tx: unknown) => unknown) =>
      original((tx) =>
        fn(
          new Proxy(tx as object, {
            get: (t, key) =>
              key === 'component'
                ? new Proxy(Reflect.get(t, key), {
                    get: (m, k) =>
                      k === method ? () => Promise.reject(new Error('boom')) : Reflect.get(m, k),
                  })
                : Reflect.get(t, key),
          }),
        ),
      )) as never)
  }

  it('T-26 failure inside search or use leaves no partial rows', async () => {
    const c = await mk('A', ['csv'])
    const { body } = await search({ keywords: ['csv'] })
    const before = await counters(c.id)
    vi.spyOn(console, 'error').mockImplementation(() => {})

    failInTx('updateMany')
    expect((await search({ keywords: ['csv'] })).status).toBe(500)
    expect(await prisma.searchQuery.count()).toBe(1)
    expect(await counters(c.id)).toEqual(before)

    vi.mocked(prisma.$transaction).mockRestore()
    failInTx('update')
    const res = await use(c.id, { queryId: body.queryId })
    expect(res.status).toBe(500)
    expect(res.body.error.code).toBe('INTERNAL_ERROR')
    expect(await counters(c.id)).toEqual(before)
    expect((await prisma.searchResult.findFirstOrThrow()).used).toBe(false)
    expect(await prisma.usageEvent.count()).toBe(0)
  })
})
