'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'

export function Nav() {
  const { user, ready, signOut } = useAuth()
  const router = useRouter()
  return (
    <header className="border-b">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3 text-sm"
      >
        <Link href="/" className="font-semibold">
          Component Catalogue
        </Link>
        <Link href="/search">Search</Link>
        <Link href="/browse">Browse</Link>
        {user?.role === 'CATALOGUER' && <Link href="/console">Console</Link>}
        <div className="ml-auto flex items-center gap-3">
          {!ready ? null : user ? (
            <>
              <span className="text-muted-foreground">
                {user.name} ({user.role.toLowerCase()})
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  signOut()
                  router.push('/')
                }}
              >
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">Log in</Link>
              <Link href="/register">Register</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
