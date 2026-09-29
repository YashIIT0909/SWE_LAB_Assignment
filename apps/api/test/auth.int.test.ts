import jwt from 'jsonwebtoken'
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { app } from '../src/app'
import { createUser, prisma, resetDb } from './helpers'

const register = (body: object) => request(app).post('/api/v1/auth/register').send(body)
const valid = { name: 'Priya Nair', email: 'Priya@Example.com', password: 's3cretpass' }

beforeEach(resetDb)

describe('auth', () => {
  it('T-02 register always creates a USER and returns a token', async () => {
    const res = await register({ ...valid, role: 'CATALOGUER' })
    expect(res.status).toBe(201)
    expect(res.body.user).toMatchObject({ email: 'priya@example.com', role: 'USER' })
    expect(res.body.token).toEqual(expect.any(String))
  })

  it('T-03 register with existing email in another case is EMAIL_TAKEN', async () => {
    await register(valid)
    const res = await register({ ...valid, email: 'PRIYA@example.com' })
    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('EMAIL_TAKEN')
  })

  it('register validates name, email and password length', async () => {
    for (const body of [
      { ...valid, name: '' },
      { ...valid, email: 'nope' },
      { ...valid, password: 'short' },
      { ...valid, password: 'x'.repeat(73) },
    ]) {
      const res = await register(body)
      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    }
  })

  it('T-04 login correct, wrong password, unknown email', async () => {
    await register(valid)
    const ok = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: valid.email, password: valid.password })
    expect(ok.status).toBe(200)
    expect(ok.body.user.role).toBe('USER')
    for (const body of [
      { email: valid.email, password: 'wrongpass1' },
      { email: 'nobody@example.com', password: valid.password },
    ]) {
      const res = await request(app).post('/api/v1/auth/login').send(body)
      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS')
    }
  })

  it('T-05 /auth/me with no, malformed, expired and valid token', async () => {
    const { user, auth } = await createUser()
    const expired = jwt.sign({ role: 'USER' }, process.env.JWT_SECRET!, {
      subject: user.id,
      expiresIn: -10,
    })
    for (const h of [
      {},
      { Authorization: 'Bearer garbage' },
      { Authorization: `Bearer ${expired}` },
    ]) {
      const res = await request(app).get('/api/v1/auth/me').set(h)
      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHENTICATED')
    }
    const res = await request(app).get('/api/v1/auth/me').set(auth)
    expect(res.status).toBe(200)
    expect(res.body.user.id).toBe(user.id)
  })

  it('/auth/me for a deleted user is UNAUTHENTICATED', async () => {
    const { user, auth } = await createUser()
    await prisma.user.delete({ where: { id: user.id } })
    const res = await request(app).get('/api/v1/auth/me').set(auth)
    expect(res.status).toBe(401)
  })

  it('T-44 password stored as bcrypt and never returned', async () => {
    const res = await register(valid)
    const row = await prisma.user.findUniqueOrThrow({ where: { email: 'priya@example.com' } })
    expect(row.passwordHash).toMatch(/^\$2[aby]\$10\$/)
    const login = await request(app).post('/api/v1/auth/login').send(valid)
    const me = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${res.body.token}`)
    for (const body of [res.body, login.body, me.body])
      expect(JSON.stringify(body)).not.toContain('passwordHash')
  })

  it('malformed JSON body is a VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{bad')
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})
