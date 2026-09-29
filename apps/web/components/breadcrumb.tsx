import type { CategoryRef } from '@sccs/shared'
import Link from 'next/link'

export function Breadcrumb({ items }: { items: CategoryRef[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap gap-1">
        <li>
          <Link href="/browse" className="hover:underline">
            All categories
          </Link>
        </li>
        {items.map((c, i) => (
          <li key={c.id} className="flex gap-1">
            <span aria-hidden>/</span>
            {i === items.length - 1 ? (
              <span aria-current="page" className="text-foreground">
                {c.name}
              </span>
            ) : (
              <Link href={`/browse/${c.id}`} className="hover:underline">
                {c.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
