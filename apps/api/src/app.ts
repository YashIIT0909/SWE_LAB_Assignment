import cors from 'cors'
import express from 'express'
import { authenticate } from './middleware/auth'
import { errorHandler, notFoundRoute } from './middleware/errorHandler'
import { authRouter } from './routes/auth'
import { categoriesRouter } from './routes/categories'
import { componentsRouter } from './routes/components'
import { healthRouter } from './routes/health'
import { keywordsRouter } from './routes/keywords'
import { notationsRouter } from './routes/notations'
import { reportsRouter } from './routes/reports'
import { searchRouter } from './routes/search'

export const app = express()
// WEB_ORIGIN may list several origins, comma separated
app.use(cors({ origin: (process.env.WEB_ORIGIN ?? 'http://localhost:3000').split(',') }))
app.use(express.json({ limit: '1mb' }))
app.use(authenticate)

const api = express.Router()
api.use('/health', healthRouter)
api.use('/auth', authRouter)
api.use('/categories', categoriesRouter)
api.use('/notations', notationsRouter)
api.use('/components', componentsRouter)
api.use('/keywords', keywordsRouter)
api.use('/search', searchRouter)
api.use('/reports', reportsRouter)

app.use('/api/v1', api)
app.use(notFoundRoute)
app.use(errorHandler)
