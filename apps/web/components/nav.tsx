'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Boxes, FolderTree, LogOut, Search, ShieldCheck, User } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

export function Nav() {
  const { user, ready, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md transition-all">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-2.5 text-sm"
      >
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-xs group-hover:scale-105 transition-transform">
              <Boxes className="size-4.5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-foreground text-sm sm:text-base">
                Component Catalogue
              </span>
              <span className="hidden sm:inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                SCCS
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <Link
              href="/search"
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                isActive('/search')
                  ? 'bg-muted text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
            >
              <Search className="size-3.5" />
              <span>Search</span>
            </Link>
            <Link
              href="/browse"
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                isActive('/browse')
                  ? 'bg-muted text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
            >
              <FolderTree className="size-3.5" />
              <span>Browse</span>
            </Link>
            {user?.role === 'CATALOGUER' && (
              <Link
                href="/console"
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  isActive('/console')
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-semibold'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )}
              >
                <ShieldCheck className="size-3.5 text-amber-600 dark:text-amber-400" />
                <span>Console</span>
              </Link>
            )}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {!ready ? null : user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-border/80 bg-muted/40 px-3 py-1 text-xs shadow-2xs">
                <div className="flex size-4.5 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="size-3" />
                </div>
                <span className="font-medium text-foreground">{user.name}</span>
                <span
                  className={cn(
                    'rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                    user.role === 'CATALOGUER'
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                      : 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30',
                  )}
                >
                  ({user.role.toLowerCase()})
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10"
                onClick={() => {
                  signOut()
                  router.push('/')
                }}
              >
                <LogOut className="size-3.5" />
                <span>Log out</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className={buttonVariants({
                  size: 'sm',
                  className: 'h-8 text-xs font-semibold shadow-xs',
                })}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
