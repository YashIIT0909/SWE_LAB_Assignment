'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { DrawioFrame } from '@/components/drawio-frame'
import { FormError } from '@/components/form-error'
import { RequireRole } from '@/components/require-role'
import { useComponent } from '@/lib/queries'

function Editor() {
  const { id } = useParams<{ id: string }>()
  const { data: c, error, isPending } = useComponent(id)

  if (isPending) return <p>Loading…</p>
  if (!c) return <FormError error={error} />
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Link href={`/components/${c.id}`} className="text-sm underline">
          ← Back to {c.name}
        </Link>
      </div>
      <DrawioFrame
        xml={c.content ?? ''}
        mode="editor"
        className="h-[calc(100vh-10rem)] w-full rounded-lg border"
      />
    </div>
  )
}

export default function Page() {
  return (
    <RequireRole>
      <Editor />
    </RequireRole>
  )
}
