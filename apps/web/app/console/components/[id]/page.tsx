'use client'
import { useParams } from 'next/navigation'
import { ComponentForm } from '@/components/component-form'
import { FormError } from '@/components/form-error'
import { useComponent } from '@/lib/queries'

export default function EditComponent() {
  const { id } = useParams<{ id: string }>()
  const c = useComponent(id)
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Edit component</h1>
      {c.isPending && <p>Loading…</p>}
      <FormError error={c.error} />
      {c.data && <ComponentForm key={c.data.updatedAt} initial={c.data} />}
    </div>
  )
}
