import { Router } from 'express'
import * as c from '../controllers/keyword.controller'

export const keywordsRouter = Router().get('/', c.suggest)
