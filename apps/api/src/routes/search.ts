import { Router } from 'express'
import * as c from '../controllers/search.controller'

export const searchRouter = Router().post('/', c.search)
