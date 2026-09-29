import { Router } from 'express'
import * as c from '../controllers/auth.controller'
import { requireLogin } from '../middleware/auth'

export const authRouter = Router()
  .post('/register', c.register)
  .post('/login', c.login)
  .get('/me', requireLogin, c.me)
