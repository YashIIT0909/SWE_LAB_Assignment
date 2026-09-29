'use client'

import type { HealthResponse } from '@sccs/shared'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  Activity,
  ArrowRight,
  FolderTree,
  Layers,
  Search,
  ShieldCheck,
  Sparkles,
  Sliders,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

const POPULAR_KEYWORDS = [
  'parser',
  'auth',
  'data-structure',
  'uml',
  'erd',
  'sorting',
  'api',
  'crypto',
]

export default function Home() {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState('')
  const health = useQuery({ queryKey: ['health'], queryFn: () => api<HealthResponse>('/health') })

  const handleSearchSubmit = (keywordsString: string) => {
    const k = keywordsString
      .split(/[\s,]+/)
      .filter(Boolean)
      .join(',')
    if (k) router.push(`/search?k=${encodeURIComponent(k)}`)
  }

  return (
    <div className="space-y-16 py-4 sm:py-8">
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-b from-card via-card/60 to-background/30 p-6 sm:p-12 lg:p-16 shadow-xs">
        {/* Ambient Gradient Glow */}
        <div
          className="pointer-events-none absolute -top-24 left-1/2 -z-10 -translate-x-1/2 blur-3xl opacity-25 dark:opacity-35"
          aria-hidden="true"
        >
          <div className="aspect-1155/678 w-[50rem] bg-gradient-to-tr from-indigo-500 via-sky-400 to-purple-500" />
        </div>

        <div className="mx-auto max-w-3xl text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3.5 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-400 shadow-2xs">
            <Sparkles className="size-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Software Component Cataloguing System • SCCS</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground leading-[1.15]">
            Discover, Reuse & Govern <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-600 bg-clip-text text-transparent dark:from-indigo-400 dark:via-purple-300 dark:to-sky-400">
              Reusable Software Components
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
            A centralized catalogue for architectural system designs (UML, ERD, DFD) and runnable
            code modules (Java, Python, C++, TypeScript). Find components quickly, track real-world
            reuse telemetry, and keep your software catalogue lean.
          </p>

          {/* Search Form */}
          <form
            role="search"
            className="mx-auto max-w-xl space-y-3 pt-2"
            onSubmit={(e) => {
              e.preventDefault()
              const k = String(new FormData(e.currentTarget).get('k') ?? '')
              handleSearchSubmit(k)
            }}
          >
            <div className="relative flex items-center rounded-xl border border-border/80 bg-background/95 p-1.5 shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              <Search className="ml-3 size-5 text-muted-foreground shrink-0" />
              <Input
                name="k"
                aria-label="Keywords"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search by keywords (e.g. parser, auth, uml)..."
                className="h-10 border-0 bg-transparent px-3 text-sm focus-visible:ring-0 focus-visible:outline-none shadow-none"
              />
              <Button type="submit" size="sm" className="h-9 px-4 gap-1.5 font-semibold shrink-0">
                <Search className="size-3.5" />
                <span>Search</span>
              </Button>
            </div>

            {/* Keyword Pills */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-xs text-muted-foreground">
              <span className="font-medium mr-1">Popular:</span>
              {POPULAR_KEYWORDS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSearchValue(tag)
                    handleSearchSubmit(tag)
                  }}
                  className="rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-xs text-foreground/80 hover:bg-muted hover:text-foreground hover:border-border transition-colors cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </form>

          {/* Action Links */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link
              href="/browse"
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className: 'h-9 gap-2 shadow-2xs',
              })}
            >
              <FolderTree className="size-4 text-indigo-500" />
              <span>Browse by category</span>
              <ArrowRight className="size-3.5 text-muted-foreground" />
            </Link>
            <Link
              href="/search"
              className={buttonVariants({
                variant: 'ghost',
                size: 'sm',
                className: 'h-9 gap-2 text-muted-foreground hover:text-foreground',
              })}
            >
              <Sliders className="size-4 text-sky-500" />
              <span>Advanced Search & Filters</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Core Capabilities / What the Project Does */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            What SCCS Does
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Engineered to streamline software reuse, prevent redundant development, and purge
            obsolete components.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1 */}
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs hover:border-indigo-500/40 hover:shadow-sm transition-all space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <Layers className="size-5" />
              </div>
              <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
                Dual Spectrum
              </span>
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Architectural Designs & Source Code
            </h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Catalogue high-level architectural designs (UML Class/Sequence diagrams, ERD schemas,
              DFDs) alongside runnable code modules (Java, Python, C++, TypeScript, JavaScript).
              Strong notation-kind verification ensures high data integrity.
            </p>
            <div className="pt-2 flex flex-wrap gap-1.5 text-[11px]">
              <span className="rounded border border-border/70 px-2 py-0.5 bg-muted/60 text-foreground font-medium">
                UML
              </span>
              <span className="rounded border border-border/70 px-2 py-0.5 bg-muted/60 text-foreground font-medium">
                ERD
              </span>
              <span className="rounded border border-border/70 px-2 py-0.5 bg-muted/60 text-foreground font-medium">
                DFD
              </span>
              <span className="rounded border border-border/70 px-2 py-0.5 bg-muted/60 text-foreground font-medium">
                Java
              </span>
              <span className="rounded border border-border/70 px-2 py-0.5 bg-muted/60 text-foreground font-medium">
                Python
              </span>
              <span className="rounded border border-border/70 px-2 py-0.5 bg-muted/60 text-foreground font-medium">
                TypeScript
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs hover:border-sky-500/40 hover:shadow-sm transition-all space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                <FolderTree className="size-5" />
              </div>
              <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700 dark:text-sky-400 border border-sky-500/20">
                Hierarchical Taxonomy
              </span>
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Arbitrary-Depth Category Trees
            </h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Classify components systematically across multi-level domain hierarchies. Includes
              automatic recursive component rollups across subtrees, cycle prevention rules, and
              safe reassignment on deletion.
            </p>
            <div className="pt-2 flex flex-wrap gap-1.5 text-[11px]">
              <span className="rounded border border-border/70 px-2 py-0.5 bg-muted/60 text-foreground font-medium">
                Recursive Rollups
              </span>
              <span className="rounded border border-border/70 px-2 py-0.5 bg-muted/60 text-foreground font-medium">
                Cycle Detection
              </span>
              <span className="rounded border border-border/70 px-2 py-0.5 bg-muted/60 text-foreground font-medium">
                Breadcrumb Navigation
              </span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs hover:border-emerald-500/40 hover:shadow-sm transition-all space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Activity className="size-5" />
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                Smart Telemetry
              </span>
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Autonomous Usage & Impression Tracking
            </h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Every search query logs result impressions (
              <code className="text-[11px] font-mono font-medium text-foreground bg-muted px-1.5 py-0.5 rounded border border-border/60">
                queryHitCount
              </code>
              ). When a developer marks a component as used, true adoption (
              <code className="text-[11px] font-mono font-medium text-foreground bg-muted px-1.5 py-0.5 rounded border border-border/60">
                useCount
              </code>
              ) increments and unadopted hits (
              <code className="text-[11px] font-mono font-medium text-foreground bg-muted px-1.5 py-0.5 rounded border border-border/60">
                queryHitNotUsedCount
              </code>
              ) decrement.
            </p>
            <div className="pt-2 flex flex-wrap gap-1.5 text-[11px]">
              <span className="rounded border border-border/70 px-2 py-0.5 bg-muted/60 text-foreground font-medium">
                Usage Telemetry
              </span>
              <span className="rounded border border-border/70 px-2 py-0.5 bg-muted/60 text-foreground font-medium">
                Search Query History
              </span>
              <span className="rounded border border-border/70 px-2 py-0.5 bg-muted/60 text-foreground font-medium">
                Adoption Analytics
              </span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs hover:border-amber-500/40 hover:shadow-sm transition-all space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <ShieldCheck className="size-5" />
              </div>
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/20">
                Lifecycle Governance
              </span>
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Criteria-Based Component Purging
            </h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Prevent catalog rot with automated candidate discovery algorithms. Flag components
              with low usage, high ignored query hits, or prolonged inactivity, and safely purge
              them with immutable audit logs.
            </p>
            <div className="pt-2 flex flex-wrap gap-1.5 text-[11px]">
              <span className="rounded border border-border/70 px-2 py-0.5 bg-muted/60 text-foreground font-medium">
                Automated Discovery
              </span>
              <span className="rounded border border-border/70 px-2 py-0.5 bg-muted/60 text-foreground font-medium">
                Full Audit Log
              </span>
              <span className="rounded border border-border/70 px-2 py-0.5 bg-muted/60 text-foreground font-medium">
                Role-Gated Actions
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Workflow */}
      <section className="rounded-2xl border border-border/60 bg-muted/15 p-6 sm:p-10 space-y-6">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            How The Catalogue Operates
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Three simple phases ensure high software reuse efficiency and clean governance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="flex flex-col items-center text-center space-y-2.5 p-4 rounded-xl bg-card border border-border/60 shadow-2xs">
            <div className="flex size-9 items-center justify-center rounded-full bg-indigo-500 text-white font-bold text-xs shadow-xs">
              1
            </div>
            <h4 className="font-semibold text-sm text-foreground">1. Catalogue & Tag</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Cataloguers register software designs or code modules, classify them in the category
              tree, and associate relevant keywords.
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-2.5 p-4 rounded-xl bg-card border border-border/60 shadow-2xs">
            <div className="flex size-9 items-center justify-center rounded-full bg-sky-500 text-white font-bold text-xs shadow-xs">
              2
            </div>
            <h4 className="font-semibold text-sm text-foreground">2. Search & Browse</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Developers search using weighted terms (exact match = 2, prefix = 1) or browse
              categories to discover reusable components.
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-2.5 p-4 rounded-xl bg-card border border-border/60 shadow-2xs">
            <div className="flex size-9 items-center justify-center rounded-full bg-emerald-500 text-white font-bold text-xs shadow-xs">
              3
            </div>
            <h4 className="font-semibold text-sm text-foreground">3. Adopt & Govern</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Developers mark used components. Unused components that frequently appear without
              adoption are flagged for purging.
            </p>
          </div>
        </div>
      </section>

      {/* System Highlights Strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border/60 bg-card/60 text-center space-y-1">
          <p className="text-2xl font-bold text-foreground">2</p>
          <p className="text-xs font-medium text-muted-foreground">
            Component Kinds (Design & Code)
          </p>
        </div>
        <div className="p-4 rounded-xl border border-border/60 bg-card/60 text-center space-y-1">
          <p className="text-2xl font-bold text-foreground">10+</p>
          <p className="text-xs font-medium text-muted-foreground">Supported Notations</p>
        </div>
        <div className="p-4 rounded-xl border border-border/60 bg-card/60 text-center space-y-1">
          <p className="text-2xl font-bold text-foreground">Weighted</p>
          <p className="text-xs font-medium text-muted-foreground">Keyword Ranking Engine</p>
        </div>
        <div className="p-4 rounded-xl border border-border/60 bg-card/60 text-center space-y-1">
          <p className="text-2xl font-bold text-foreground">100%</p>
          <p className="text-xs font-medium text-muted-foreground">Audited Cataloguer Writes</p>
        </div>
      </section>

      {/* Live System Health Pill */}
      <div className="pt-2 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-3.5 py-1 text-xs text-muted-foreground shadow-2xs">
          <span
            className={cn(
              'size-2 rounded-full',
              health.data?.status === 'ok'
                ? 'bg-emerald-500 animate-pulse'
                : health.isError
                  ? 'bg-destructive'
                  : 'bg-amber-500',
            )}
          />
          <span>
            {health.isError && 'API unreachable'}
            {health.data && `API ${health.data.status}, database ${health.data.db}`}
            {health.isPending && 'Checking system status...'}
          </span>
        </div>
      </div>
    </div>
  )
}
