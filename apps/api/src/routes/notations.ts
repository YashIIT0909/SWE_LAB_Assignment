import { Router } from 'express'
import * as c from '../controllers/notation.controller'
import { requireCataloguer } from '../middleware/auth'

export const notationsRouter = Router().get('/', c.list).post('/', requireCataloguer, c.create)
