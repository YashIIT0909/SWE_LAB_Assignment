'use client'
import type { UseResult } from '@sccs/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FormError } from '@/components/form-error'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'

/** Marks a component as used; passes the search's queryId so the hit counts as used. */
export function UseButton({ componentId, queryId }: { componentId: string; queryId?: string }) {
  const { user, ready } = useAuth()
  const path = usePathname()
  const qc = useQueryClient()
  const use = useMutation({
    mutationFn: () =>
      api<UseResult>(`/components/${componentId}/use`, {
        method: 'POST',
        json: queryId ? { queryId } : {},
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['components', 'detail', componentId] }),
  })

  if (!ready) return null
  if (!user)
    return (
      <Link href={`/login?next=${encodeURIComponent(path)}`} className="text-sm underline">
        Log in to use this component
      </Link>
    )
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm" onClick={() => use.mutate()} disabled={use.isPending}>
        Use this component
      </Button>
      {use.data && (
        <span role="status" className="text-sm text-muted-foreground">
          Marked as used ({use.data.useCount} uses in total)
        </span>
      )}
      <FormError error={use.error} />
    </div>
  )
}
