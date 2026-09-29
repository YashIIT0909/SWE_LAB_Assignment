'use client'
import type { ReportSummary } from '@sccs/shared'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { FormError } from '@/components/form-error'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api } from '@/lib/api'

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm font-normal text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-semibold tabular-nums">{value}</CardContent>
    </Card>
  )
}

function Ranking({
  title,
  rows,
  value,
  empty,
}: {
  title: string
  rows: { id: string; name: string }[]
  value: (r: never) => number
  empty: string
}) {
  return (
    <section className="space-y-2">
      <h2 className="font-medium">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ol className="space-y-1 text-sm">
          {rows.map((r) => (
            <li key={r.id} className="flex justify-between gap-2 border-b py-1">
              <Link href={`/components/${r.id}`} className="hover:underline">
                {r.name}
              </Link>
              <span className="tabular-nums">{value(r as never)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export default function ConsoleOverview() {
  const s = useQuery({
    queryKey: ['reports', 'summary'],
    queryFn: () => api<ReportSummary>('/reports/summary'),
  })
  if (s.isPending) return <p>Loading…</p>
  if (!s.data) return <FormError error={s.error} />
  const { totals, byNotation, topUsed, topNotUsed, neverUsedCount } = s.data
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Catalogue report</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Components" value={totals.components} />
        <Stat label="Designs" value={totals.design} />
        <Stat label="Code" value={totals.code} />
        <Stat label="Never used" value={neverUsedCount} />
        <Stat label="Categories" value={totals.categories} />
        <Stat label="Keywords" value={totals.keywords} />
        <Stat label="Searches" value={totals.searches} />
        <Stat label="Uses" value={totals.uses} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Ranking
          title="Most used"
          rows={topUsed}
          value={(r: { useCount: number }) => r.useCount}
          empty="Nothing has been used yet."
        />
        <Ranking
          title="Shown in searches but not used"
          rows={topNotUsed}
          value={(r: { queryHitNotUsedCount: number }) => r.queryHitNotUsedCount}
          empty="No unused search hits."
        />
      </div>
      <section className="space-y-2">
        <h2 className="font-medium">Components by notation</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Notation</TableHead>
              <TableHead>Kind</TableHead>
              <TableHead className="text-right">Components</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {byNotation.map((n) => (
              <TableRow key={n.notationId}>
                <TableCell>{n.name}</TableCell>
                <TableCell>{n.kind === 'DESIGN' ? 'Design' : 'Code'}</TableCell>
                <TableCell className="text-right tabular-nums">{n.components}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
      <p>
        <Link href="/console/purge" className="underline">
          Review purge candidates
        </Link>
      </p>
    </div>
  )
}
