import type { ComponentSummary } from '@sccs/shared'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export function ComponentCard({
  c,
  href = `/components/${c.id}`,
  extra,
  matched,
}: {
  c: ComponentSummary
  href?: string
  extra?: React.ReactNode
  matched?: string[]
}) {
  return (
    <article className="space-y-2 rounded-lg border p-4">
      <div className="flex flex-wrap items-baseline gap-2">
        <h3 className="font-medium">
          <Link href={href} className="hover:underline">
            {c.name}
          </Link>
        </h3>
        <Badge variant="outline">{c.kind === 'DESIGN' ? 'Design' : 'Code'}</Badge>
        <Badge variant="secondary">{c.notation.name}</Badge>
        <span className="ml-auto text-xs text-muted-foreground">
          used {c.useCount}× · v{c.version}
        </span>
      </div>
      <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
      <ul className="flex flex-wrap gap-1" aria-label="Keywords">
        {c.keywords.map((k) => (
          <li key={k.id}>
            <Badge variant={matched?.includes(k.term) ? 'default' : 'outline'}>{k.term}</Badge>
          </li>
        ))}
      </ul>
      {extra}
    </article>
  )
}
