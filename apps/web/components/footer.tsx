import Link from 'next/link'
import { Boxes, ShieldCheck, Code2, Layers, Activity } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border/60 bg-muted/20 text-muted-foreground text-xs">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <Boxes className="size-4" />
              </div>
              <span className="font-bold tracking-tight text-sm">
                Software Component Cataloguing System
              </span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed max-w-md">
              A comprehensive platform for cataloguing, discovering, and governing reusable software
              components. Supports architectural designs (UML, ERD, DFD) and runnable code (Java,
              Python, C++, TypeScript) with intelligent telemetry tracking to eliminate dead weight.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-700 dark:text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                IEEE Std 830 Aligned
              </span>
              <span>•</span>
              <span>Software Engineering Lab Assignment</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider">
              Catalogue Access
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/browse" className="hover:text-foreground transition-colors">
                  Browse Categories
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-foreground transition-colors">
                  Keyword Search Engine
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-foreground transition-colors">
                  User Authentication
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-foreground transition-colors">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider">
              Core Pillars
            </h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Layers className="size-3.5 text-indigo-500 shrink-0" />
                <span>Dual Spectrum (Design & Code)</span>
              </li>
              <li className="flex items-center gap-2">
                <Code2 className="size-3.5 text-sky-500 shrink-0" />
                <span>Weighted Relevance Ranking</span>
              </li>
              <li className="flex items-center gap-2">
                <Activity className="size-3.5 text-emerald-500 shrink-0" />
                <span>Autonomous Query Telemetry</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="size-3.5 text-amber-500 shrink-0" />
                <span>Criteria-Based Purge Governance</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <p>
            © {new Date().getFullYear()} Software Component Cataloguing System (SCCS). All rights
            reserved.
          </p>
          <div className="flex items-center gap-3 text-muted-foreground">
            <span>Next.js 16</span>
            <span>•</span>
            <span>Express 5</span>
            <span>•</span>
            <span>Prisma 7</span>
            <span>•</span>
            <span>PostgreSQL</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
