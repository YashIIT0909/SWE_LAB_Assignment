'use client'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { DrawioFrame } from '@/components/drawio-frame'
import { useAuth } from '@/lib/auth'

/** Read-only draw.io preview of a DESIGN component; the canvas editor needs a login. */
export function DiagramPanel({ id, content }: { id: string; content: string | null }) {
  const { user } = useAuth()

  return (
    <aside aria-label="Diagram" className="space-y-2 lg:sticky lg:top-4 lg:self-start">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Diagram</h2>
        {user && (content || user.role === 'CATALOGUER') && (
          <Link href={`/components/${id}/editor`} className={buttonVariants({ size: 'sm' })}>
            Open in canvas
          </Link>
        )}
      </div>
      <div className="relative">
        {content ? (
          <DrawioFrame
            xml={content}
            mode="preview"
            className={`h-[32rem] w-full rounded-lg border ${user ? '' : 'pointer-events-none blur-sm'}`}
          />
        ) : (
          <p className="rounded-lg bg-muted p-4 text-sm">No diagram has been added yet.</p>
        )}
        {!user && content && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Link href="/login" className="rounded-md bg-background px-3 py-1.5 text-sm shadow">
              Log in to view and edit
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}
