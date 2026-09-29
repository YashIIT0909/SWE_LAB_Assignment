'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FormError } from '@/components/form-error'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

export function DeleteComponentButton({
  id,
  name,
  onDeleted,
}: {
  id: string
  name: string
  onDeleted?: () => void
}) {
  const qc = useQueryClient()
  const del = useMutation({
    mutationFn: () => api(`/components/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      // skip refetching the deleted component's own detail query (it would 404)
      qc.invalidateQueries({
        predicate: (q) => q.queryKey[0] === 'components' && q.queryKey[2] !== id,
      })
      qc.invalidateQueries({ queryKey: ['categories'] })
      onDeleted?.()
    },
  })
  return (
    <>
      <Button
        size="sm"
        variant="destructive"
        disabled={del.isPending}
        onClick={() => confirm(`Delete "${name}"? This cannot be undone.`) && del.mutate()}
      >
        Delete
      </Button>
      <FormError error={del.error} />
    </>
  )
}
