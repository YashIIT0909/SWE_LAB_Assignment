'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { DrawioFrame } from '@/components/drawio-frame'
import { FormError } from '@/components/form-error'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { RequireRole } from '@/components/require-role'
import { Select } from '@/components/select'
import { api } from '@/lib/api'
import { useComponent, useComponentPage } from '@/lib/queries'
import type { ComponentDetail } from '@sccs/shared'

function Editor() {
  const { id } = useParams<{ id: string }>()
  const { data: c, error, isPending } = useComponent(id)
  const { data: designs } = useComponentPage('/components?kind=DESIGN&pageSize=50')
  const [merge, setMerge] = useState<{ xml: string; key: number }>()
  const [failed, setFailed] = useState(false)
  const [saveKey, setSaveKey] = useState(0)
  const { user } = useAuth()
  const qc = useQueryClient()
  const save = useMutation({
    mutationFn: (content: string) =>
      api(`/components/${id}`, { method: 'PATCH', json: { content } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['components'] }),
  })

  async function add(otherId: string) {
    if (!otherId) return
    setFailed(false)
    try {
      const other = await api<ComponentDetail>(`/components/${otherId}`)
      if (other.content) setMerge({ xml: other.content, key: Date.now() })
    } catch {
      setFailed(true)
    }
  }

  if (isPending) return <p>Loading…</p>
  if (!c) return <FormError error={error} />
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Link href={`/components/${c.id}`} className="text-sm underline">
          ← Back to {c.name}
        </Link>
        <Select
          className="w-64"
          aria-label="Add component"
          value=""
          onChange={(e) => add(e.target.value)}
        >
          <option value="">Add component…</option>
          {designs?.items
            .filter((d) => d.id !== c.id)
            .map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
        </Select>
        {user?.role === 'CATALOGUER' && (
          <Button size="sm" disabled={save.isPending} onClick={() => setSaveKey((k) => k + 1)}>
            {save.isPending ? 'Saving…' : 'Save to catalogue'}
          </Button>
        )}
        {save.isSuccess && <span className="text-sm text-muted-foreground">Saved.</span>}
        {save.isError && <span className="text-sm text-destructive">Could not save.</span>}
        {failed && <span className="text-sm text-destructive">Could not add that component.</span>}
      </div>
      <DrawioFrame
        xml={c.content ?? ''}
        mode="editor"
        merge={merge}
        save={{ key: saveKey, onXml: save.mutate }}
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
