import type { RequestHandler } from 'express'
import type { Role } from '@sccs/shared'
import { AppError } from '../errors'
import { verifyToken, type TokenPayload } from '../services/auth.service'

declare module 'express-serve-static-core' {
  interface Request {
    user?: TokenPayload
  }
}

/** Attaches req.user when a valid Bearer token is sent; never rejects. */
export const authenticate: RequestHandler = (req, _res, next) => {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? []
  if (scheme === 'Bearer' && token) req.user = verifyToken(token) ?? undefined
  next()
}

export const requireLogin: RequestHandler = (req, _res, next) =>
  next(req.user ? undefined : new AppError('UNAUTHENTICATED', 401, 'Login required'))

export const requireRole =
  (role: Role): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(new AppError('UNAUTHENTICATED', 401, 'Login required'))
    if (req.user.role !== role) return next(new AppError('FORBIDDEN', 403, 'Not allowed'))
    next()
  }

export const requireCataloguer = requireRole('CATALOGUER')
