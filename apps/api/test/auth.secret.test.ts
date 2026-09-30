import { describe, expect, it } from 'vitest'
import { sign } from '../src/services/auth.service'

describe('JWT secret', () => {
  it('sign() throws instead of using a fallback when JWT_SECRET is missing', () => {
    const saved = process.env.JWT_SECRET
    delete process.env.JWT_SECRET
    try {
      expect(() => sign({ id: 'u1', role: 'USER' })).toThrow('JWT_SECRET is not set')
    } finally {
      if (saved !== undefined) process.env.JWT_SECRET = saved
    }
  })
})
