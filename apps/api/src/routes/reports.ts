import { Router } from 'express'
import * as c from '../controllers/report.controller'
import { requireCataloguer } from '../middleware/auth'

export const reportsRouter = Router()
  .use(requireCataloguer)
  .get('/summary', c.summary)
  .get('/purge-candidates', c.purgeCandidates)
  .post('/purge', c.purge)
  .get('/audit', c.audit)
