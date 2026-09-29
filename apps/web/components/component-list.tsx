'use client'
import { COMPONENT_SORTS } from '@sccs/shared'
import { useState } from 'react'
import { ComponentCard } from '@/components/component-card'
import { FormError } from '@/components/form-error'
import { Pagination } from '@/components/pagination'
import { Select } from '@/components/select'
import { Label } from '@/components/ui/label'
import { qs, useComponentPage } from '@/lib/queries'

const SORT_LABELS: Record<(typeof COMPONENT_SORTS)[number], string> = {
  name: 'Name',
  newest: 'Newest',
  mostUsed: 'Most used',
}

/** Paginated, sortable component list for one category. */
export function CategoryComponents({ categoryId }: { categoryId: string }) {
  const [sort, setSort] = useState<(typeof COMPONENT_SORTS)[number]>('name')
  const [includeDescendants, setInclude] = useState(true)
  const [page, setPage] = useState(1)
  const list = useComponentPage(
    `/categories/${categoryId}/components${qs({ sort, includeDescendants, page })}`,
  )
  return (
    <section className="space-y-3" aria-label="Components">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <h2 className="font-medium">Components {list.data && `(${list.data.total})`}</h2>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={includeDescendants}
            onChange={(e) => {
              setInclude(e.target.checked)
              setPage(1)
            }}
          />
          Include subcategories
        </label>
        <div className="ml-auto flex items-center gap-2">
          <Label htmlFor="sort">Sort</Label>
          <Select
            id="sort"
            className="w-auto"
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
          >
            {COMPONENT_SORTS.map((s) => (
              <option key={s} value={s}>
                {SORT_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <FormError error={list.error} />
      {list.data?.items.length === 0 && (
        <p className="text-muted-foreground">No components in this category yet.</p>
      )}
      <div className="grid gap-3">
        {list.data?.items.map((c) => (
          <ComponentCard key={c.id} c={c} />
        ))}
      </div>
      {list.data && <Pagination {...list.data} onPage={setPage} />}
    </section>
  )
}
