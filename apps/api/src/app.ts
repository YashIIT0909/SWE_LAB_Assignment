import cors from 'cors'
import express from 'express'
import { authenticate } from './middleware/auth'
import { errorHandler, notFoundRoute } from './middleware/errorHandler'
import { authRouter } from './routes/auth'
import { healthRouter } from './routes/health'

export const app = express()
// WEB_ORIGIN may list several origins, comma separated
app.use(cors({ origin: (process.env.WEB_ORIGIN ?? 'http://localhost:3000').split(',') }))
app.use(express.json({ limit: '1mb' }))
app.use(authenticate)

const api = express.Router()
api.use('/health', healthRouter)
api.use('/auth', authRouter)

app.use('/api/v1', api)
app.use(notFoundRoute)
app.use(errorHandler)
