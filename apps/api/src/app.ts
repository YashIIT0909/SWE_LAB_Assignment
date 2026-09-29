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

const configuredOrigins = process.env.WEB_ORIGIN
  ? process.env.WEB_ORIGIN.split(',').map((o) => o.trim())
  : null

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (!configuredOrigins || configuredOrigins.includes('*')) {
        return callback(null, true)
      }
      if (
        configuredOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.startsWith('http://localhost:')
      ) {
        return callback(null, true)
      }
      return callback(null, true)
    },
    credentials: true,
  })
)
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
app.use('/v1', api)
app.use('/api', api)
app.use('/', api)
app.use(notFoundRoute)
app.use(errorHandler)

