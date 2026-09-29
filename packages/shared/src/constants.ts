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

export interface CategoryRef {
  id: string
  name: string
  slug: string
}

export interface CategoryNode extends CategoryRef {
  description: string | null
  componentCount: number
  totalComponentCount: number
  children: CategoryNode[]
}

export interface CategoryDto extends CategoryRef {
  description: string | null
  parentId: string | null
  createdAt: string
  updatedAt: string
}

export interface CategoryDetail extends CategoryDto {
  breadcrumb: CategoryRef[]
  children: (CategoryRef & { description: string | null })[]
  componentCount: number
}

export interface NotationDto {
  id: string
  name: string
  kind: ComponentKind
}

export interface DeleteCategoryResult {
  deletedId: string
  movedComponents: number
  movedChildren: number
  reassignedTo: string | null
}

export const AUDIT_ACTIONS = [
  'COMPONENT_CREATE',
  'COMPONENT_UPDATE',
  'COMPONENT_DELETE',
  'COMPONENT_PURGE',
  'KEYWORDS_UPDATE',
  'CATEGORY_CREATE',
  'CATEGORY_UPDATE',
  'CATEGORY_DELETE',
  'NOTATION_CREATE',
] as const
export type AuditAction = (typeof AUDIT_ACTIONS)[number]

export interface KeywordDto {
  id: string
  term: string
}

export interface ComponentSummary {
  id: string
  name: string
  description: string
  kind: ComponentKind
  version: string
  author: string | null
  sourceUrl: string | null
  notation: NotationDto
  category: CategoryRef
  keywords: KeywordDto[]
  useCount: number
  queryHitCount: number
  queryHitNotUsedCount: number
  lastUsedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ComponentDetail extends ComponentSummary {
  content: string | null
  createdBy: { id: string; name: string }
  category: CategoryRef & { breadcrumb: CategoryRef[] }
}

export interface ComponentKeywords {
  componentId: string
  keywords: KeywordDto[]
}

export interface SearchItem extends ComponentSummary {
  matchedKeywords: string[]
  score: number
}

export interface SearchResponse extends Page<SearchItem> {
  queryId: string
}

export interface UseResult {
  componentId: string
  useCount: number
  queryHitCount: number
  queryHitNotUsedCount: number
  lastUsedAt: string
  countedQueryHit: boolean
}
