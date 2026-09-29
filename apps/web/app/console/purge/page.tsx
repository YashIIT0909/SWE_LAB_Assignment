'use client'
import type { Page, PurgeCandidate, PurgeParams, PurgeResult } from '@sccs/shared'
import { purgeParams } from '@sccs/shared'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormError } from '@/components/form-error'
import { Pagination } from '@/components/pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api } from '@/lib/api'
import { qs } from '@/lib/queries'
import { parseOrThrow } from '@/lib/validate'

const FIELDS: [keyof PurgeParams, string][] = [
  ['maxUses', 'Used at most (times)'],
  ['minNotUsedHits', 'Shown but not used at least (times)'],
  ['unusedForDays', 'Not used for (days)'],
  ['olderThanDays', 'Catalogued more than (days ago)'],
]
const DEFAULTS = purgeParams.parse({})

export default function PurgePage() {
  const qc = useQueryClient()
  const [params, setParams] = useState<PurgeParams>(DEFAULTS)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [paramError, setParamError] = useState<unknown>(null)

  const list = useQuery({
    queryKey: ['reports', 'purge-candidates', params, page],
    queryFn: () =>
      api<Page<PurgeCandidate> & { params: PurgeParams }>(
        `/reports/purge-candidates${qs({ ...params, page })}`,
      ),
    placeholderData: keepPreviousData,
  })

  const purge = useMutation({
    mutationFn: () =>
      api<PurgeResult>('/reports/purge', {
        method: 'POST',
        json: { componentIds: [...selected], params },
      }),
    onSuccess: () => {
      setSelected(new Set())
      qc.invalidateQueries({ queryKey: ['reports'] })
      qc.invalidateQueries({ queryKey: ['components'] })
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  const items = list.data?.items ?? []
  const allOnPage = items.length > 0 && items.every((c) => selected.has(c.id))
  const toggle = (id: string, on: boolean) =>
    setSelected((s) => {
      const next = new Set(s)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Purge unused components</h1>
      <form
        className="grid gap-3 rounded-lg border p-4 sm:grid-cols-5 sm:items-end"
        onSubmit={(e) => {
          e.preventDefault()
          try {
            setParams(parseOrThrow(purgeParams, Object.fromEntries(new FormData(e.currentTarget))))
            setParamError(null)
            setPage(1)
            setSelected(new Set())
          } catch (err) {
            setParamError(err)
          }
        }}
      >
        {FIELDS.map(([key, label]) => (
          <div key={key} className="space-y-1">
            <Label htmlFor={key}>{label}</Label>
            <Input id={key} name={key} type="number" min={0} required defaultValue={params[key]} />
          </div>
        ))}
        <Button type="submit">Find candidates</Button>
        <div className="sm:col-span-5">
          <FormError error={paramError ?? list.error} />
        </div>
      </form>

      {purge.data && (
        <div role="status" className="rounded-lg border p-3 text-sm">
          Deleted {purge.data.deleted.length}.{' '}
          {purge.data.skipped.length > 0 &&
            `Skipped ${purge.data.skipped.length} (${purge.data.skipped
              .map((s) => (s.reason === 'NOT_FOUND' ? 'already gone' : 'no longer a candidate'))
              .join(', ')}).`}
        </div>
      )}

      <section className="space-y-3" aria-label="Candidates">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-medium">
            {list.data ? `${list.data.total} candidates` : 'Candidates'}
          </h2>
          <Button
            variant="destructive"
            className="ml-auto"
            disabled={selected.size === 0 || purge.isPending}
            onClick={() =>
              confirm(`Permanently delete ${selected.size} component(s)?`) && purge.mutate()
            }
          >
            Purge selected ({selected.size})
          </Button>
        </div>
        <FormError error={purge.error} />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <input
                  type="checkbox"
                  aria-label="Select all on this page"
                  checked={allOnPage}
                  onChange={(e) => items.forEach((c) => toggle(c.id, e.target.checked))}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Kind</TableHead>
              <TableHead className="text-right">Uses</TableHead>
              <TableHead className="text-right">Shown</TableHead>
              <TableHead className="text-right">Shown, not used</TableHead>
              <TableHead>Last used</TableHead>
              <TableHead>Catalogued</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    aria-label={`Select ${c.name}`}
                    checked={selected.has(c.id)}
                    onChange={(e) => toggle(c.id, e.target.checked)}
                  />
                </TableCell>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.kind === 'DESIGN' ? 'Design' : 'Code'}</TableCell>
                <TableCell className="text-right tabular-nums">{c.useCount}</TableCell>
                <TableCell className="text-right tabular-nums">{c.queryHitCount}</TableCell>
                <TableCell className="text-right tabular-nums">{c.queryHitNotUsedCount}</TableCell>
                <TableCell>
                  {c.lastUsedAt ? new Date(c.lastUsedAt).toLocaleDateString() : 'never'}
                </TableCell>
                <TableCell>{new Date(c.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {list.data?.total === 0 && (
          <p className="text-muted-foreground">No components match these criteria.</p>
        )}
        {list.data && <Pagination {...list.data} onPage={setPage} />}
      </section>
    </div>
  )
}
