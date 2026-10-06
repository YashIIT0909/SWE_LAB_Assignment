'use client'
import { loginBody, registerBody, type AuthResult } from '@sccs/shared'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormError } from '@/components/form-error'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { parseOrThrow } from '@/lib/validate'

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const { signIn } = useAuth()
  const router = useRouter()
  const next = useSearchParams().get('next') ?? '/'
  const submit = useMutation({
    mutationFn: (form: FormData) => {
      const values = Object.fromEntries(form)
      const body =
        mode === 'login' ? parseOrThrow(loginBody, values) : parseOrThrow(registerBody, values)
      return api<AuthResult>(`/auth/${mode}`, { method: 'POST', json: body })
    },
    onSuccess: (r) => {
      if (mode === 'register') return router.push('/login')
      signIn(r)
      router.push(next.startsWith('/') ? next : '/')
    },
  })

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle>
          <h1>{mode === 'login' ? 'Log in' : 'Create an account'}</h1>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            submit.mutate(new FormData(e.currentTarget))
          }}
        >
          {mode === 'register' && (
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required maxLength={100} autoComplete="name" />
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={mode === 'register' ? 8 : 1}
              maxLength={72}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>
          <FormError error={submit.error} />
          <Button type="submit" className="w-full" disabled={submit.isPending}>
            {mode === 'login' ? 'Log in' : 'Register'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {mode === 'login' ? (
              <>
                No account?{' '}
                <Link href="/register" className="underline">
                  Register
                </Link>
              </>
            ) : (
              <>
                Have an account?{' '}
                <Link href="/login" className="underline">
                  Log in
                </Link>
              </>
            )}
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
