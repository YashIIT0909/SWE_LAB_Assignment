'use client'
import type { HealthResponse } from '@sccs/shared'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'

export default function Home() {
  const router = useRouter()
  const health = useQuery({ queryKey: ['health'], queryFn: () => api<HealthResponse>('/health') })
  return (
    <div className="mx-auto max-w-2xl space-y-8 py-10 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Software Component Catalogue</h1>
        <p className="text-muted-foreground">
          Find reusable designs and code by keyword, or browse the category tree.
        </p>
      </div>
      <form
        role="search"
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          const k = String(new FormData(e.currentTarget).get('k') ?? '')
            .split(/[\s,]+/)
            .filter(Boolean)
            .join(',')
          if (k) router.push(`/search?k=${encodeURIComponent(k)}`)
        }}
      >
        <Input name="k" aria-label="Keywords" placeholder="e.g. csv parser" />
        <Button type="submit">Search</Button>
      </form>
      <p>
        <Link href="/browse" className="underline">
          Browse by category
        </Link>
      </p>
      <p className="text-xs text-muted-foreground">
        {health.isError && 'API unreachable'}
        {health.data && `API ${health.data.status}, database ${health.data.db}`}
      </p>
    </div>
  )
}
