'use client'
import type { CategoryDetail, CategoryNode, ComponentKind, NotationDto } from '@sccs/shared'
import { useQuery } from '@tanstack/react-query'
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
