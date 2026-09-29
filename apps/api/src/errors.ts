import type { ErrorCode } from '@sccs/shared'

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message)
  }
}

export const notFound = (what: string) => new AppError('NOT_FOUND', 404, `${what} not found`)
