'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Breadcrumb } from '@/components/breadcrumb'
import { CategoryTree } from '@/components/category-tree'
import { FormError } from '@/components/form-error'
import { useCategory, useCategoryTree } from '@/lib/queries'

export default function BrowsePage() {
  const id = useParams<{ id?: string[] }>().id?.[0]
  const tree = useCategoryTree()
  const category = useCategory(id)

  return (
    <div className="grid gap-6 md:grid-cols-[260px_1fr]">
      <aside aria-label="Categories">
        <h2 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">Categories</h2>
        {tree.isPending && <p className="text-sm">Loading…</p>}
        <FormError error={tree.error} />
        {tree.data && <CategoryTree nodes={tree.data} activeId={id} />}
      </aside>
      <section className="space-y-4">
        {!id && (
          <>
            <h1 className="text-2xl font-semibold">Browse components</h1>
            <p className="text-muted-foreground">Pick a category to see its components.</p>
          </>
        )}
        {id && category.isPending && <p>Loading…</p>}
        <FormError error={category.error} />
        {category.data && (
          <>
            <Breadcrumb items={category.data.breadcrumb} />
            <h1 className="text-2xl font-semibold">{category.data.name}</h1>
            {category.data.description && (
              <p className="text-muted-foreground">{category.data.description}</p>
            )}
            {category.data.children.length > 0 && (
              <div>
                <h2 className="mb-1 font-medium">Subcategories</h2>
                <ul className="flex flex-wrap gap-2">
                  {category.data.children.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/browse/${c.id}`}
                        className="rounded border px-2 py-1 text-sm hover:bg-muted"
                      >
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
