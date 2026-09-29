import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { app } from '../src/app'

describe('health', () => {
  it('T-01 GET /health reports api and db ok', async () => {
    const res = await request(app).get('/api/v1/health')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ status: 'ok', db: 'ok' })
  })

  it('unknown route returns NOT_FOUND error shape', async () => {
    const res = await request(app).get('/api/v1/nope')
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})
