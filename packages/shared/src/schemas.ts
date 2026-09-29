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
