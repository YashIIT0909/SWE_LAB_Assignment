import { Router } from 'express'
import * as c from '../controllers/category.controller'
import { requireCataloguer } from '../middleware/auth'

export const categoriesRouter = Router()
  .get('/tree', c.tree)
  .get('/:id', c.get)
  .post('/', requireCataloguer, c.create)
  .patch('/:id', requireCataloguer, c.update)
  .delete('/:id', requireCataloguer, c.remove)
