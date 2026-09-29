'use client'
import type { CategoryNode } from '@sccs/shared'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function CategoryTree({ nodes, activeId }: { nodes: CategoryNode[]; activeId?: string }) {
  if (nodes.length === 0) return null
  return (
    <ul className="space-y-1 border-l pl-3 first:border-l-0 first:pl-0">
      {nodes.map((n) => (
        <li key={n.id}>
          <Link
            href={`/browse/${n.id}`}
            aria-current={n.id === activeId ? 'page' : undefined}
            className={cn(
              'flex justify-between gap-2 rounded px-2 py-1 text-sm hover:bg-muted',
              n.id === activeId && 'bg-muted font-medium',
            )}
          >
            <span>{n.name}</span>
            <span className="text-muted-foreground">{n.totalComponentCount}</span>
          </Link>
          <CategoryTree nodes={n.children} activeId={activeId} />
        </li>
      ))}
    </ul>
  )
}
