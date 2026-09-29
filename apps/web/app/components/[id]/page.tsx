'use client'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Breadcrumb } from '@/components/breadcrumb'
import { DeleteComponentButton } from '@/components/delete-component-button'
import { FormError } from '@/components/form-error'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { useComponent } from '@/lib/queries'

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString() : 'never')

export default function ComponentPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const { data: c, error, isPending } = useComponent(id)

  if (isPending) return <p>Loading…</p>
  if (!c) return <FormError error={error} />
  return (
    <article className="space-y-5">
      <Breadcrumb items={c.category.breadcrumb} />
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{c.name}</h1>
          <Badge variant="outline">{c.kind === 'DESIGN' ? 'Design' : 'Code'}</Badge>
          <Badge variant="secondary">{c.notation.name}</Badge>
        </div>
        <p className="text-muted-foreground">{c.description}</p>
      </header>

      {user?.role === 'CATALOGUER' && (
        <div className="flex gap-2">
          <Link
            href={`/console/components/${c.id}`}
            className={buttonVariants({ size: 'sm', variant: 'outline' })}
          >
            Edit
          </Link>
          <DeleteComponentButton id={c.id} name={c.name} onDeleted={() => router.push('/browse')} />
        </div>
      )}

      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[max-content_1fr]">
        <dt className="text-muted-foreground">Version</dt>
        <dd>{c.version}</dd>
        <dt className="text-muted-foreground">Author</dt>
        <dd>{c.author ?? '—'}</dd>
        <dt className="text-muted-foreground">Source</dt>
        <dd>
          {c.sourceUrl ? (
            <a href={c.sourceUrl} className="underline" target="_blank" rel="noreferrer noopener">
              {c.sourceUrl}
            </a>
          ) : (
            '—'
          )}
        </dd>
        <dt className="text-muted-foreground">Catalogued by</dt>
        <dd>
          {c.createdBy.name} on {fmt(c.createdAt)}
        </dd>
        <dt className="text-muted-foreground">Usage</dt>
        <dd>
          used {c.useCount}× · shown in {c.queryHitCount} searches · {c.queryHitNotUsedCount} not
          followed by a use · last used {fmt(c.lastUsedAt)}
        </dd>
        <dt className="text-muted-foreground">Keywords</dt>
        <dd>
          <ul className="flex flex-wrap gap-1">
            {c.keywords.map((k) => (
              <li key={k.id}>
                <Badge variant="outline">{k.term}</Badge>
              </li>
            ))}
          </ul>
        </dd>
      </dl>

      {c.content && (
        <section>
          <h2 className="mb-2 font-medium">Content</h2>
          <pre className="max-h-[32rem] overflow-auto rounded-lg bg-muted p-4 text-xs">
            <code>{c.content}</code>
          </pre>
        </section>
      )}
    </article>
  )
}
