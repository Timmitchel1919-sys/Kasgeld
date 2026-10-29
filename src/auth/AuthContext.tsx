import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { isFirebaseConfigured } from '../firebase/client'
import { observeAuth, signOutCurrentUser } from '../firebase/auth'

type AuthState = {
  user: User | null
  loading: boolean
  configured: boolean
  signOut: () => Promise<void>
}
const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured) return
    return observeAuth(nextUser => { setUser(nextUser); setLoading(false) })
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    configured: isFirebaseConfigured,
    signOut: signOutCurrentUser,
  }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth moet binnen AuthProvider worden gebruikt.')
  return value
}

