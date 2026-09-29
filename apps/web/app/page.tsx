'use client'
import type { HealthResponse } from '@sccs/shared'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export default function Home() {
  const health = useQuery({ queryKey: ['health'], queryFn: () => api<HealthResponse>('/health') })
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Software Component Catalogue</h1>
      <p className="text-sm text-slate-600">
        {health.isPending && 'Checking API…'}
        {health.isError && 'API unreachable'}
        {health.data && `API ${health.data.status}, DB ${health.data.db}`}
      </p>
    </div>
  )
}
