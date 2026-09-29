export const ERROR_CODES = [
  'VALIDATION_ERROR',
  'INVALID_CREDENTIALS',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'EMAIL_TAKEN',
  'DUPLICATE_NAME',
  'CATEGORY_NOT_EMPTY',
  'CATEGORY_CYCLE',
  'NOTATION_KIND_MISMATCH',
  'INTERNAL_ERROR',
] as const
export type ErrorCode = (typeof ERROR_CODES)[number]

export interface ApiErrorBody {
  error: { code: ErrorCode; message: string; details?: unknown }
}

export interface HealthResponse {
  status: 'ok' | 'degraded'
  db: 'ok' | 'down'
  time: string
}
