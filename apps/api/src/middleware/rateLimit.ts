import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../errors'

interface RateLimitOptions {
  windowMs?: number
  max?: number
  message?: string
}

export function rateLimit(options: RateLimitOptions = {}) {
  const windowMs = options.windowMs ?? 15 * 60 * 1000
  const max = options.max ?? 60
  const hits = new Map<string, { count: number; resetAt: number }>()

  return (req: Request, res: Response, next: NextFunction) => {
    // In test environment, skip unless explicit test header is provided
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
      return next()
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown'
    const now = Date.now()
    const record = hits.get(ip)

    if (!record || record.resetAt <= now) {
      hits.set(ip, { count: 1, resetAt: now + windowMs })
      res.setHeader('X-RateLimit-Limit', max)
      res.setHeader('X-RateLimit-Remaining', max - 1)
      return next()
    }

    record.count += 1
    const remaining = Math.max(0, max - record.count)
    res.setHeader('X-RateLimit-Limit', max)
    res.setHeader('X-RateLimit-Remaining', remaining)
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000))

    if (record.count > max) {
      res.setHeader('Retry-After', Math.ceil((record.resetAt - now) / 1000))
      return next(
        new AppError(
          'RATE_LIMITED',
          429,
          options.message ?? 'Too many requests, please try again later',
        ),
      )
    }

    next()
  }
}
