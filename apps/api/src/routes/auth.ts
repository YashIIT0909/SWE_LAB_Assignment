import { Router } from 'express'
import * as c from '../controllers/auth.controller'
import { requireLogin } from '../middleware/auth'
import { rateLimit } from '../middleware/rateLimit'

const authLimiter = rateLimit({ max: 20, windowMs: 15 * 60 * 1000 })

export const authRouter = Router()
  .post('/register', authLimiter, c.register)
  .post('/login', authLimiter, c.login)
  .get('/me', requireLogin, c.me)
