import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { AuthScreen } from './AuthScreen'
import { VerificationScreen } from './VerificationScreen'

export function AuthGate({ children }: { children: ReactNode }) {
  const { configured, loading, user } = useAuth()
  if (!configured) return <>{children}</>
  if (loading) return <main className="auth-shell"><div className="auth-loader" aria-label="Authenticatie laden" /></main>
  if (!user) return <AuthScreen />
  if (!user.emailVerified) return <VerificationScreen user={user} />
  return <>{children}</>
}
