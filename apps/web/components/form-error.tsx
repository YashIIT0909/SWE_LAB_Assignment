import { ApiError } from '@/lib/api'

/** Shows an API or validation error message; renders nothing when there is none. */
export function FormError({ error }: { error: unknown }) {
  if (!error) return null
  const message =
    error instanceof ApiError || error instanceof Error ? error.message : 'Something went wrong'
  return (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  )
}
