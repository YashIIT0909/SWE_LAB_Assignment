import { Router } from 'express'
import * as c from '../controllers/component.controller'
import { use } from '../controllers/search.controller'
import { requireCataloguer, requireLogin } from '../middleware/auth'

export const componentsRouter = Router()
  .get('/', c.list)
  .get('/:id', c.get)
  .post('/', requireCataloguer, c.create)
  .patch('/:id', requireCataloguer, c.update)
  .delete('/:id', requireCataloguer, c.remove)
  .put('/:id/keywords', requireCataloguer, c.putKeywords)
  .post('/:id/keywords', requireCataloguer, c.addKeywords)
  .delete('/:id/keywords/:keywordId', requireCataloguer, c.removeKeyword)
  .post('/:id/use', requireLogin, use)
