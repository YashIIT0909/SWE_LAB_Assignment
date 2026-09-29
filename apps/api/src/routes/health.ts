import { Router } from 'express'
import * as health from '../services/health.service'

export const healthRouter = Router().get('/', async (_req, res) => {
  const result = await health.check()
  res.status(result.db === 'ok' ? 200 : 503).json(result)
})
