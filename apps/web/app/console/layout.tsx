import Link from 'next/link'
import { RequireRole } from '@/components/require-role'

const links = [
  ['/console', 'Reports'],
  ['/console/categories', 'Categories'],
  ['/console/notations', 'Notations'],
  ['/console/components', 'Components'],
  ['/console/purge', 'Purge'],
  ['/console/audit', 'Audit'],
] as const

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="CATALOGUER">
      <div className="space-y-6">
        <nav aria-label="Console" className="flex flex-wrap gap-4 border-b pb-3 text-sm">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="hover:underline">
              {label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </RequireRole>
  )
}
