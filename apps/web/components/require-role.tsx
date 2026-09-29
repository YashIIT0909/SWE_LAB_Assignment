'use client'
import type { Role } from '@sccs/shared'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'

/** UI-only guard; the API enforces roles itself. */
export function RequireRole({ role, children }: { role?: Role; children: React.ReactNode }) {
  const { user, ready } = useAuth()
  const path = usePathname()
  if (!ready) return <p className="text-sm text-muted-foreground">Loading…</p>
  if (!user)
    return (
      <p>
        Please{' '}
        <Link className="underline" href={`/login?next=${encodeURIComponent(path)}`}>
          log in
        </Link>{' '}
        to continue.
      </p>
    )
  if (role && user.role !== role) return <p>This page is for cataloguers only.</p>
  return <>{children}</>
}
