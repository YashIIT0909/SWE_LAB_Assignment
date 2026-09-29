import { z } from 'zod'

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
