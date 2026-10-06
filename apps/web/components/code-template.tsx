'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'

/** Scrollable code panel; copying is allowed only when signed in, otherwise the code is blurred. */
export function CodeTemplate({ content }: { content: string | null }) {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)

  return (
    <aside aria-label="Template code" className="space-y-2 lg:sticky lg:top-4 lg:self-start">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Template code</h2>
        {user && content && (
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              navigator.clipboard.writeText(content).then(() => {
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              })
            }
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
        )}
      </div>
      <div className="relative">
        <pre
          className={`max-h-[32rem] overflow-auto rounded-lg bg-muted p-4 text-xs ${
            user ? '' : 'pointer-events-none select-none blur-sm'
          }`}
          aria-hidden={!user}
          onCopy={(e) => !user && e.preventDefault()}
        >
          <code>{content ?? '// No template code has been added for this component yet.'}</code>
        </pre>
        {!user && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Link href="/login" className="rounded-md bg-background px-3 py-1.5 text-sm shadow">
              Log in to view and copy
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}
