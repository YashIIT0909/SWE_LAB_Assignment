'use client'
import { createCategoryBody, updateCategoryBody, type CategoryNode } from '@sccs/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormError } from '@/components/form-error'
import { Select } from '@/components/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { flatten, useCategoryTree } from '@/lib/queries'
import { parseOrThrow } from '@/lib/validate'

type Flat = ReturnType<typeof flatten>

function ParentOptions({ flat, exclude }: { flat: Flat; exclude?: Set<string> }) {
  return (
    <>
      <option value="">(top level)</option>
      {flat
        .filter(({ node }) => !exclude?.has(node.id))
        .map(({ node, depth }) => (
          <option key={node.id} value={node.id}>
            {'— '.repeat(depth)}
            {node.name}
          </option>
        ))}
    </>
  )
}

const subtreeIds = (n: CategoryNode): Set<string> =>
  new Set([n.id, ...flatten(n.children).map((f) => f.node.id)])

function formValues(form: HTMLFormElement) {
  const v = Object.fromEntries(new FormData(form)) as Record<string, string>
  return { name: v.name, description: v.description || null, parentId: v.parentId || null }
}

function useInvalidate() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['categories'] })
}

function CreateForm({ flat }: { flat: Flat }) {
  const invalidate = useInvalidate()
  const create = useMutation({
    mutationFn: (form: HTMLFormElement) =>
      api('/categories', {
        method: 'POST',
        json: parseOrThrow(createCategoryBody, formValues(form)),
      }),
    onSuccess: (_d, form) => {
      form.reset()
      invalidate()
    },
  })
  return (
    <form
      className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
      onSubmit={(e) => {
        e.preventDefault()
        create.mutate(e.currentTarget)
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="new-name">Name</Label>
        <Input id="new-name" name="name" required maxLength={100} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="new-description">Description</Label>
        <Input id="new-description" name="description" maxLength={1000} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="new-parent">Parent</Label>
        <Select id="new-parent" name="parentId">
          <ParentOptions flat={flat} />
        </Select>
      </div>
      <Button type="submit" disabled={create.isPending}>
        Add category
      </Button>
      <div className="sm:col-span-4">
        <FormError error={create.error} />
      </div>
    </form>
  )
}

function Row({ node, depth, flat }: { node: CategoryNode; depth: number; flat: Flat }) {
  const invalidate = useInvalidate()
  const [mode, setMode] = useState<'view' | 'edit' | 'delete'>('view')
  const subtree = subtreeIds(node)
  const parentId = flat.find((f) => f.node.children.some((c) => c.id === node.id))?.node.id ?? ''
  const empty = node.children.length === 0 && node.componentCount === 0

  const save = useMutation({
    mutationFn: (form: HTMLFormElement) =>
      api(`/categories/${node.id}`, {
        method: 'PATCH',
        json: parseOrThrow(updateCategoryBody, formValues(form)),
      }),
    onSuccess: () => {
      setMode('view')
      invalidate()
    },
  })
  const remove = useMutation({
    mutationFn: (reassignTo?: string) =>
      api(`/categories/${node.id}${reassignTo ? `?reassignTo=${reassignTo}` : ''}`, {
        method: 'DELETE',
      }),
    onSuccess: invalidate,
  })

  return (
    <li className="border-b py-2">
      <div className="flex flex-wrap items-center gap-2" style={{ paddingLeft: depth * 20 }}>
        <span className="font-medium">{node.name}</span>
        <span className="text-xs text-muted-foreground">
          {node.componentCount} here / {node.totalComponentCount} total
        </span>
        <div className="ml-auto flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMode(mode === 'edit' ? 'view' : 'edit')}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              if (!empty) return setMode(mode === 'delete' ? 'view' : 'delete')
              if (confirm(`Delete "${node.name}"?`)) remove.mutate(undefined)
            }}
          >
            Delete
          </Button>
        </div>
      </div>
      {mode === 'edit' && (
        <form
          className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]"
          style={{ paddingLeft: depth * 20 }}
          onSubmit={(e) => {
            e.preventDefault()
            save.mutate(e.currentTarget)
          }}
        >
          <Input aria-label="Name" name="name" defaultValue={node.name} required maxLength={100} />
          <Input
            aria-label="Description"
            name="description"
            defaultValue={node.description ?? ''}
            maxLength={1000}
          />
          <Select aria-label="Parent" name="parentId" defaultValue={parentId}>
            <ParentOptions flat={flat} exclude={subtree} />
          </Select>
          <Button type="submit" size="sm" disabled={save.isPending}>
            Save
          </Button>
          <div className="sm:col-span-4">
            <FormError error={save.error} />
          </div>
        </form>
      )}
      {mode === 'delete' && (
        <form
          className="mt-2 flex flex-wrap items-center gap-2"
          style={{ paddingLeft: depth * 20 }}
          onSubmit={(e) => {
            e.preventDefault()
            const to = new FormData(e.currentTarget).get('reassignTo') as string
            remove.mutate(to)
          }}
        >
          <Label htmlFor={`reassign-${node.id}`}>Move its subcategories and components to</Label>
          <Select
            id={`reassign-${node.id}`}
            name="reassignTo"
            required
            className="w-auto"
            defaultValue=""
          >
            <option value="" disabled>
              Choose a category
            </option>
            {flat
              .filter(({ node: n }) => !subtree.has(n.id))
              .map(({ node: n, depth: d }) => (
                <option key={n.id} value={n.id}>
                  {'— '.repeat(d)}
                  {n.name}
                </option>
              ))}
          </Select>
          <Button type="submit" size="sm" variant="destructive" disabled={remove.isPending}>
            Move and delete
          </Button>
        </form>
      )}
      <div style={{ paddingLeft: depth * 20 }}>
        <FormError error={remove.error} />
      </div>
    </li>
  )
}

export default function ConsoleCategories() {
  const tree = useCategoryTree()
  const flat = tree.data ? flatten(tree.data) : []
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Categories</h1>
      <CreateForm flat={flat} />
      {tree.isPending && <p>Loading…</p>}
      <FormError error={tree.error} />
      <ul>
        {flat.map(({ node, depth }) => (
          <Row key={node.id} node={node} depth={depth} flat={flat} />
        ))}
      </ul>
    </div>
  )
}
