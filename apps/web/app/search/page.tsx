'use client'
import { COMPONENT_KINDS, searchBody, type ComponentKind, type SearchResponse } from '@sccs/shared'
import { useMutation } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'
import { ComponentCard } from '@/components/component-card'
import { FormError } from '@/components/form-error'
import { KeywordInput } from '@/components/keyword-input'
import { Pagination } from '@/components/pagination'
import { Select } from '@/components/select'
import { UseButton } from '@/components/use-button'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { flatten, useCategoryTree, useNotations } from '@/lib/queries'
import { parseOrThrow } from '@/lib/validate'

function SearchPage() {
  const params = useSearchParams()
  const router = useRouter()
  const [keywords, setKeywords] = useState<string[]>(
    () => params.get('k')?.split(',').filter(Boolean) ?? [],
  )
  const [match, setMatch] = useState<'any' | 'all'>('any')
  const [kind, setKind] = useState<ComponentKind | ''>('')
  const [notationId, setNotationId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [includeDescendants, setInclude] = useState(true)
  const notations = useNotations(kind || undefined)
  const tree = useCategoryTree()

  // search is a POST with side effects (hit counters), so it is a mutation, never auto-refetched
  const run = useMutation({
    mutationFn: (page: number) =>
      api<SearchResponse>('/search', {
        method: 'POST',
        json: parseOrThrow(searchBody, {
          keywords,
          match,
          kind: kind || undefined,
          notationId: notationId || undefined,
          categoryId: categoryId || undefined,
          includeDescendants,
          page,
        }),
      }),
  })

  const ran = useRef(false)
  useEffect(() => {
    if (!ran.current && keywords.length) run.mutate(1)
    ran.current = true
  }, [keywords.length, run])

  const submit = (page: number) => {
    router.replace(`/search?k=${encodeURIComponent(keywords.join(','))}`, { scroll: false })
    run.mutate(page)
  }

  const res = run.data
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Search components</h1>
      <form
        className="grid gap-4 rounded-lg border p-4"
        onSubmit={(e) => {
          e.preventDefault()
          submit(1)
        }}
      >
        <div className="space-y-1">
          <Label htmlFor="search-keywords">Keywords (1–10)</Label>
          <KeywordInput id="search-keywords" value={keywords} onChange={setKeywords} max={10} />
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <fieldset className="space-y-1">
            <legend className="text-sm font-medium">Match</legend>
            <div className="flex gap-4 text-sm">
              {(['any', 'all'] as const).map((m) => (
                <label key={m} className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="match"
                    checked={match === m}
                    onChange={() => setMatch(m)}
                  />
                  {m === 'any' ? 'Any keyword' : 'All keywords'}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="space-y-1">
            <Label htmlFor="search-kind">Kind</Label>
            <Select
              id="search-kind"
              value={kind}
              onChange={(e) => {
                setKind(e.target.value as ComponentKind | '')
                setNotationId('')
              }}
            >
              <option value="">Any</option>
              {COMPONENT_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k === 'DESIGN' ? 'Design' : 'Code'}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="search-notation">Notation / language</Label>
            <Select
              id="search-notation"
              value={notationId}
              onChange={(e) => setNotationId(e.target.value)}
            >
              <option value="">Any</option>
              {notations.data?.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="search-category">Category</Label>
            <Select
              id="search-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Any</option>
              {tree.data &&
                flatten(tree.data).map(({ node, depth }) => (
                  <option key={node.id} value={node.id}>
                    {'— '.repeat(depth)}
                    {node.name}
                  </option>
                ))}
            </Select>
            {categoryId && (
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={includeDescendants}
                  onChange={(e) => setInclude(e.target.checked)}
                />
                Include subcategories
              </label>
            )}
          </div>
        </div>
        <div>
          <Button type="submit" disabled={run.isPending || keywords.length === 0}>
            Search
          </Button>
        </div>
        <FormError error={run.error} />
      </form>

      {res && (
        <section aria-label="Results" className="space-y-3">
          <h2 className="font-medium" role="status">
            {res.total} {res.total === 1 ? 'component' : 'components'} found
          </h2>
          {res.total === 0 && (
            <p className="text-muted-foreground">No components match your query.</p>
          )}
          {res.items.map((c) => (
            <ComponentCard
              key={c.id}
              c={c}
              matched={c.matchedKeywords}
              href={`/components/${c.id}?queryId=${res.queryId}`}
              extra={
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs text-muted-foreground">score {c.score}</span>
                  <UseButton componentId={c.id} queryId={res.queryId} />
                </div>
              }
            />
          ))}
          <Pagination {...res} onPage={submit} />
        </section>
      )}
    </div>
  )
}

export default function Page() {
  return (
    <Suspense>
      <SearchPage />
    </Suspense>
  )
}
