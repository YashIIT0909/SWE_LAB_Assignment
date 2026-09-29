import type { Metadata } from 'next'
import './globals.css'
import { Nav } from '@/components/nav'
import { Footer } from '@/components/footer'
import { Providers } from './providers'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Component Catalogue — Software Component Cataloguing System',
  description:
    'A central catalogue of reusable software designs (UML, ERD, DFD) and code modules (Java, Python, C++, TypeScript) with usage telemetry and lifecycle governance.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn('font-sans', geist.variable)}>
      <body className="min-h-screen bg-background text-foreground antialiased flex flex-col">
        <Providers>
          <Nav />
          <main className="mx-auto max-w-6xl px-4 py-8 flex-1 w-full">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
