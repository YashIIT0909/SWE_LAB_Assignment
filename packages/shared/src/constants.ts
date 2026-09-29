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

export type Role = 'CATALOGUER' | 'USER'
export type ComponentKind = 'DESIGN' | 'CODE'

export interface UserDto {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string
}

export interface AuthResult {
  token: string
  user: UserDto
}

export interface Page<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export const slugify = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'category'
