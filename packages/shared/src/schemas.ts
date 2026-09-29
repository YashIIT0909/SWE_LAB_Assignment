import { z } from 'zod'
import { AUDIT_ACTIONS } from './constants'

export const ROLES = ['CATALOGUER', 'USER'] as const
export const COMPONENT_KINDS = ['DESIGN', 'CODE'] as const
export const componentKind = z.enum(COMPONENT_KINDS)

export const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
})

const email = z.string().trim().toLowerCase().pipe(z.email())

export const registerBody = z.object({
  name: z.string().trim().min(1).max(100),
  email,
  password: z.string().min(8).max(72),
})
export type RegisterBody = z.infer<typeof registerBody>

export const loginBody = z.object({ email, password: z.string().min(1).max(72) })
export type LoginBody = z.infer<typeof loginBody>

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional()
const atLeastOne = (o: object) => Object.values(o).some((v) => v !== undefined)

export const createCategoryBody = z.object({
  name: z.string().trim().min(1).max(100),
  description: optionalText(1000),
  parentId: z.string().min(1).nullable().optional(),
})
export type CreateCategoryBody = z.infer<typeof createCategoryBody>

export const updateCategoryBody = createCategoryBody
  .partial()
  .refine(atLeastOne, 'At least one field is required')
export type UpdateCategoryBody = z.infer<typeof updateCategoryBody>

export const deleteCategoryQuery = z.object({ reassignTo: z.string().min(1).optional() })

export const notationQuery = z.object({ kind: componentKind.optional() })
export const createNotationBody = z.object({
  name: z.string().trim().min(1).max(50),
  kind: componentKind,
})
export type CreateNotationBody = z.infer<typeof createNotationBody>

/** Trimmed, lowercased, de-duplicated keyword terms. */
export const keywordTerms = (min: number, max: number) =>
  z
    .array(z.string().trim().toLowerCase().min(1).max(50))
    .min(min)
    .max(max)
    .transform((terms) => [...new Set(terms)])

const componentFields = {
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(5000),
  kind: componentKind,
  notationId: z.string().min(1),
  categoryId: z.string().min(1),
  version: z.string().trim().min(1).max(50),
  author: optionalText(100),
  sourceUrl: z
    .url({ protocol: /^https?$/ })
    .max(2000)
    .nullable()
    .optional(),
  content: z.string().max(100_000).nullable().optional(),
}

export const createComponentBody = z.object({
  ...componentFields,
  version: componentFields.version.default('1.0.0'),
  keywords: keywordTerms(0, 50).default([]),
})
export type CreateComponentBody = z.output<typeof createComponentBody>

export const updateComponentBody = z
  .object(componentFields)
  .partial()
  .refine(atLeastOne, 'At least one field is required')
export type UpdateComponentBody = z.output<typeof updateComponentBody>

export const COMPONENT_SORTS = ['name', 'newest', 'mostUsed'] as const
const boolParam = z
  .enum(['true', 'false'])
  .default('false')
  .transform((v) => v === 'true')

export const categoryComponentsQuery = pageQuery.extend({
  includeDescendants: boolParam,
  sort: z.enum(COMPONENT_SORTS).default('name'),
})

export const listComponentsQuery = categoryComponentsQuery.extend({
  kind: componentKind.optional(),
  notationId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  q: z.string().trim().min(1).max(100).optional(),
})
export type ListComponentsQuery = z.output<typeof listComponentsQuery>

export const putKeywordsBody = z.object({ keywords: keywordTerms(0, 50) })
export const addKeywordsBody = z.object({ keywords: keywordTerms(1, 50) })

export const keywordSuggestQuery = z.object({
  prefix: z.string().trim().toLowerCase().max(50).default(''),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

export const searchBody = pageQuery.extend({
  keywords: keywordTerms(1, 10),
  match: z.enum(['any', 'all']),
  kind: componentKind.optional(),
  notationId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  includeDescendants: z.boolean().default(false),
})
export type SearchBody = z.output<typeof searchBody>

export const useBody = z.object({ queryId: z.string().min(1).optional() })

const nonNegInt = (d: number) => z.coerce.number().int().min(0).max(1_000_000).default(d)
export const purgeParams = z.object({
  maxUses: nonNegInt(0),
  minNotUsedHits: nonNegInt(0),
  unusedForDays: nonNegInt(90),
  olderThanDays: nonNegInt(30),
})
export type PurgeParams = z.output<typeof purgeParams>

export const purgeCandidatesQuery = pageQuery.extend(purgeParams.shape)

export const purgeBody = z.object({
  componentIds: z.array(z.string().min(1)).min(1).max(100),
  params: purgeParams.prefault({}),
})

export const auditQuery = pageQuery.extend({
  action: z.enum(AUDIT_ACTIONS).optional(),
  entityType: z.enum(['Component', 'Category', 'Notation']).optional(),
})
