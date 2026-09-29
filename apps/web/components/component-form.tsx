'use client'
import {
  COMPONENT_KINDS,
  createComponentBody,
  updateComponentBody,
  type ComponentDetail,
  type ComponentKind,
} from '@sccs/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { FormError } from '@/components/form-error'
import { KeywordInput } from '@/components/keyword-input'
import { Select } from '@/components/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'
import { flatten, useCategoryTree, useNotations } from '@/lib/queries'
import { parseOrThrow } from '@/lib/validate'

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((t) => b.includes(t))

export function ComponentForm({ initial }: { initial?: ComponentDetail }) {
  const router = useRouter()
  const qc = useQueryClient()
  const [kind, setKind] = useState<ComponentKind>(initial?.kind ?? 'DESIGN')
  const [notationId, setNotationId] = useState(initial?.notation.id ?? '')
  const [keywords, setKeywords] = useState<string[]>(initial?.keywords.map((k) => k.term) ?? [])
  const notations = useNotations(kind)
  const tree = useCategoryTree()

  const save = useMutation({
    mutationFn: async (form: HTMLFormElement) => {
      const v = Object.fromEntries(new FormData(form)) as Record<string, string>
      const fields = {
        name: v.name,
        description: v.description,
        kind,
        notationId,
        categoryId: v.categoryId,
        version: v.version || '1.0.0',
        author: v.author || null,
        sourceUrl: v.sourceUrl || null,
        content: v.content || null,
      }
      if (!initial) {
        const body = parseOrThrow(createComponentBody, { ...fields, keywords })
        return api<ComponentDetail>('/components', { method: 'POST', json: body })
      }
      const body = parseOrThrow(updateComponentBody, fields)
      const updated = await api<ComponentDetail>(`/components/${initial.id}`, {
        method: 'PATCH',
        json: body,
      })
      if (
        !sameSet(
          keywords,
          initial.keywords.map((k) => k.term),
        )
      )
        await api(`/components/${initial.id}/keywords`, { method: 'PUT', json: { keywords } })
      return updated
    },
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ['components'] })
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['keywords'] })
      router.push(`/components/${c.id}`)
    },
  })

  return (
    <form
      className="grid max-w-3xl gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate(e.currentTarget)
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required maxLength={120} defaultValue={initial?.name} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          required
          maxLength={5000}
          defaultValue={initial?.description}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="kind">Kind</Label>
          <Select
            id="kind"
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as ComponentKind)
              setNotationId('')
            }}
          >
            {COMPONENT_KINDS.map((k) => (
              <option key={k} value={k}>
                {k === 'DESIGN' ? 'Design' : 'Code'}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="notationId">{kind === 'DESIGN' ? 'Design notation' : 'Language'}</Label>
          <Select
            id="notationId"
            required
            value={notationId}
            onChange={(e) => setNotationId(e.target.value)}
          >
            <option value="" disabled>
              Choose…
            </option>
            {notations.data?.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="categoryId">Category</Label>
          {tree.data && (
            <Select
              id="categoryId"
              name="categoryId"
              required
              defaultValue={initial?.category.id ?? ''}
            >
              <option value="" disabled>
                Choose…
              </option>
              {flatten(tree.data).map(({ node, depth }) => (
                <option key={node.id} value={node.id}>
                  {'— '.repeat(depth)}
                  {node.name}
                </option>
              ))}
            </Select>
          )}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="version">Version</Label>
          <Input
            id="version"
            name="version"
            maxLength={50}
            defaultValue={initial?.version ?? '1.0.0'}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="author">Author</Label>
          <Input id="author" name="author" maxLength={100} defaultValue={initial?.author ?? ''} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="sourceUrl">Source URL</Label>
          <Input
            id="sourceUrl"
            name="sourceUrl"
            type="url"
            placeholder="https://"
            defaultValue={initial?.sourceUrl ?? ''}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="keywords">Keywords</Label>
        <KeywordInput id="keywords" value={keywords} onChange={setKeywords} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="content">Content (code or diagram source)</Label>
        <Textarea
          id="content"
          name="content"
          rows={10}
          maxLength={100_000}
          className="font-mono text-xs"
          defaultValue={initial?.content ?? ''}
        />
      </div>
      <FormError error={save.error} />
      <div className="flex gap-2">
        <Button type="submit" disabled={save.isPending}>
          {initial ? 'Save changes' : 'Create component'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
