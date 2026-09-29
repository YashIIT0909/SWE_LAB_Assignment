'use client'
import { COMPONENT_KINDS, createNotationBody } from '@sccs/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FormError } from '@/components/form-error'
import { Select } from '@/components/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { useNotations } from '@/lib/queries'
import { parseOrThrow } from '@/lib/validate'

export default function ConsoleNotations() {
  const qc = useQueryClient()
  const notations = useNotations()
  const create = useMutation({
    mutationFn: (form: HTMLFormElement) =>
      api('/notations', {
        method: 'POST',
        json: parseOrThrow(createNotationBody, Object.fromEntries(new FormData(form))),
      }),
    onSuccess: (_d, form) => {
      form.reset()
      qc.invalidateQueries({ queryKey: ['notations'] })
    },
  })
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Notations</h1>
      <form
        className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault()
          create.mutate(e.currentTarget)
        }}
      >
        <div className="space-y-1">
          <Label htmlFor="notation-name">Name</Label>
          <Input id="notation-name" name="name" required maxLength={50} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="notation-kind">Kind</Label>
          <Select id="notation-kind" name="kind">
            {COMPONENT_KINDS.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </Select>
        </div>
        <Button type="submit" disabled={create.isPending}>
          Add notation
        </Button>
        <div className="sm:col-span-3">
          <FormError error={create.error} />
        </div>
      </form>
      <FormError error={notations.error} />
      {COMPONENT_KINDS.map((kind) => (
        <section key={kind}>
          <h2 className="mb-2 font-medium">
            {kind === 'DESIGN' ? 'Design notations' : 'Languages'}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {notations.data
              ?.filter((n) => n.kind === kind)
              .map((n) => (
                <li key={n.id}>
                  <Badge variant="secondary">{n.name}</Badge>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
