'use client'
import type {
  CategoryDetail,
  CategoryNode,
  ComponentDetail,
  ComponentKind,
  ComponentSummary,
  KeywordDto,
  NotationDto,
  Page,
} from '@sccs/shared'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from './api'

export const useCategoryTree = () =>
  useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: () => api<{ items: CategoryNode[] }>('/categories/tree').then((r) => r.items),
  })

export const useCategory = (id: string | undefined) =>
  useQuery({
    queryKey: ['categories', id],
    queryFn: () => api<CategoryDetail>(`/categories/${id}`),
    enabled: !!id,
  })

export const useNotations = (kind?: ComponentKind) =>
  useQuery({
    queryKey: ['notations', kind ?? 'all'],
    queryFn: () =>
      api<{ items: NotationDto[] }>(`/notations${kind ? `?kind=${kind}` : ''}`).then(
        (r) => r.items,
      ),
  })

/** Depth-first list for selects and tables. */
export function flatten(nodes: CategoryNode[], depth = 0): { node: CategoryNode; depth: number }[] {
  return nodes.flatMap((node) => [{ node, depth }, ...flatten(node.children, depth + 1)])
}

export const qs = (params: Record<string, string | number | boolean | undefined | null>) => {
  const s = new URLSearchParams()
  for (const [k, v] of Object.entries(params))
    if (v !== undefined && v !== null && v !== '') s.set(k, String(v))
  const str = s.toString()
  return str ? `?${str}` : ''
}

export const useComponentPage = (path: string) =>
  useQuery({
    queryKey: ['components', path],
    queryFn: () => api<Page<ComponentSummary>>(path),
    placeholderData: keepPreviousData,
  })

export const useComponent = (id: string) =>
  useQuery({
    queryKey: ['components', 'detail', id],
    queryFn: () => api<ComponentDetail>(`/components/${id}`),
  })

export const useKeywordSuggestions = (prefix: string) =>
  useQuery({
    queryKey: ['keywords', prefix],
    queryFn: () =>
      api<{ items: (KeywordDto & { componentCount: number })[] }>(
        `/keywords${qs({ prefix, limit: 8 })}`,
      ).then((r) => r.items),
    staleTime: 60_000,
  })
