import cors from 'cors'
import express from 'express'
import { errorHandler, notFoundRoute } from './middleware/errorHandler'
import { healthRouter } from './routes/health'

export const app = express()
app.use(cors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000' }))
app.use(express.json({ limit: '1mb' }))

const api = express.Router()
api.use('/health', healthRouter)

app.use('/api/v1', api)
app.use(notFoundRoute)
app.use(errorHandler)
