import type { ApiErrorBody, ErrorCode } from '@sccs/shared'

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: ErrorCode,
    message: string,
    public details?: unknown,
  ) {
    super(message)
  }
}

let token: string | null = null
export const setToken = (t: string | null) => {
  token = t
}

export async function api<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, headers, ...rest } = init
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  })
  if (res.status === 204) return undefined as T
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const e = (body as ApiErrorBody | null)?.error
    throw new ApiError(
      res.status,
      e?.code ?? 'INTERNAL_ERROR',
      e?.message ?? res.statusText,
      e?.details,
    )
  }
  return body as T
}
