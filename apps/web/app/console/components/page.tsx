'use client'
import { COMPONENT_KINDS } from '@sccs/shared'
import Link from 'next/link'
import { useState } from 'react'
import { DeleteComponentButton } from '@/components/delete-component-button'
import { FormError } from '@/components/form-error'
import { Pagination } from '@/components/pagination'
import { Select } from '@/components/select'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { qs, useComponentPage } from '@/lib/queries'

export default function ConsoleComponents() {
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('')
  const [page, setPage] = useState(1)
  const list = useComponentPage(`/components${qs({ q: q.trim(), kind, page, sort: 'newest' })}`)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">Components</h1>
        <Link href="/console/components/new" className={buttonVariants({ className: 'ml-auto' })}>
          New component
        </Link>
      </div>
      <div className="flex flex-wrap gap-3">
        <Input
          aria-label="Filter by name or description"
          placeholder="Filter by name or description"
          className="max-w-xs"
          value={q}
          maxLength={100}
          onChange={(e) => {
            setQ(e.target.value)
            setPage(1)
          }}
        />
        <Select
          aria-label="Kind"
          className="w-auto"
          value={kind}
          onChange={(e) => {
            setKind(e.target.value)
            setPage(1)
          }}
        >
          <option value="">All kinds</option>
          {COMPONENT_KINDS.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </Select>
      </div>
      <FormError error={list.error} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Notation</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Uses</TableHead>
            <TableHead className="text-right">Hits not used</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.data?.items.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <Link href={`/components/${c.id}`} className="hover:underline">
                  {c.name}
                </Link>
              </TableCell>
              <TableCell>{c.notation.name}</TableCell>
              <TableCell>{c.category.name}</TableCell>
              <TableCell className="text-right">{c.useCount}</TableCell>
              <TableCell className="text-right">{c.queryHitNotUsedCount}</TableCell>
              <TableCell className="flex justify-end gap-2">
                <Link
                  href={`/console/components/${c.id}`}
                  className={buttonVariants({ size: 'sm', variant: 'outline' })}
                >
                  Edit
                </Link>
                <DeleteComponentButton id={c.id} name={c.name} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {list.data?.items.length === 0 && (
        <p className="text-muted-foreground">No components found.</p>
      )}
      {list.data && <Pagination {...list.data} onPage={setPage} />}
    </div>
  )
}
