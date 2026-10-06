import type { z } from 'zod'

/** Parses with a shared schema; throws an Error naming the first bad field. */
export function parseOrThrow<S extends z.ZodType>(schema: S, value: unknown): z.output<S> {
  const r = schema.safeParse(value)
  if (r.success) return r.data
  const issue = r.error.issues[0]
  if (issue.path[0] === 'email') throw new Error('Please enter a valid email address')
  throw new Error(`${issue.path.join('.') || 'Input'}: ${issue.message}`)
}
