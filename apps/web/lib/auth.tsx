'use client'
import type { AuthResult, UserDto } from '@sccs/shared'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, setToken } from './api'

const KEY = 'sccs.token'

interface AuthState {
  user: UserDto | null
  ready: boolean
  signIn: (r: AuthResult) => void
  signOut: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient()
  const [token, setTok] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let t: string | null = null
    try {
      t = localStorage.getItem(KEY)
    } catch {
      // storage unavailable (private mode): stay logged out
    }
    setToken(t)
    setTok(t)
    setLoaded(true)
  }, [])

  const me = useQuery({
    queryKey: ['me', token],
    queryFn: () => api<{ user: UserDto }>('/auth/me').then((r) => r.user),
    enabled: !!token,
    retry: false,
  })

  const store = useCallback(
    (t: string | null) => {
      try {
        if (t) localStorage.setItem(KEY, t)
        else localStorage.removeItem(KEY)
      } catch {
        // storage unavailable (private mode): stay logged out
      }
      setToken(t)
      setTok(t)
      // refetch data that depends on who is logged in; 'me' is keyed by token already
      qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'me' })
    },
    [qc],
  )

  // a stale or revoked token: drop it
  useEffect(() => {
    if (me.isError) store(null)
  }, [me.isError, store])

  const signIn = useCallback(
    (r: AuthResult) => {
      qc.setQueryData(['me', r.token], r.user)
      store(r.token)
    },
    [qc, store],
  )

  const value: AuthState = {
    user: token ? (me.data ?? null) : null,
    ready: loaded && (!token || !me.isPending),
    signIn,
    signOut: () => store(null),
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth outside AuthProvider')
  return ctx
}
