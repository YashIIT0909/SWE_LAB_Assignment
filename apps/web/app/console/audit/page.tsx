'use client'
import { AUDIT_ACTIONS, type AuditEntry, type Page } from '@sccs/shared'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { FormError } from '@/components/form-error'
import { Pagination } from '@/components/pagination'
import { Select } from '@/components/select'
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

export default function AuditPage() {
  const [action, setAction] = useState('')
  const [page, setPage] = useState(1)
  const log = useQuery({
    queryKey: ['reports', 'audit', action, page],
    queryFn: () => api<Page<AuditEntry>>(`/reports/audit${qs({ action, page })}`),
    placeholderData: keepPreviousData,
  })
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Audit log</h1>
      <div className="flex items-center gap-2">
        <Label htmlFor="action">Action</Label>
        <Select
          id="action"
          className="w-auto"
          value={action}
          onChange={(e) => {
            setAction(e.target.value)
            setPage(1)
          }}
        >
          <option value="">All</option>
          {AUDIT_ACTIONS.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </Select>
      </div>
      <FormError error={log.error} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Who</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {log.data?.items.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="whitespace-nowrap">
                {new Date(e.createdAt).toLocaleString()}
              </TableCell>
              <TableCell>{e.actor.name}</TableCell>
              <TableCell>{e.action}</TableCell>
              <TableCell className="text-xs">
                {e.entityType} {e.entityId}
              </TableCell>
              <TableCell
                className="max-w-md truncate font-mono text-xs"
                title={JSON.stringify(e.details)}
              >
                {e.details ? JSON.stringify(e.details) : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {log.data?.total === 0 && <p className="text-muted-foreground">No entries.</p>}
      {log.data && <Pagination {...log.data} onPage={setPage} />}
    </div>
  )
}
