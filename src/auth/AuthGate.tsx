import { useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { AuthScreen } from './AuthScreen'
import { VerificationScreen } from './VerificationScreen'
import { LandingPage } from '../landing/LandingPage'

export function AuthGate({ children }: { children: ReactNode }) {
  const { configured, loading, user } = useAuth()
  const [publicScreen, setPublicScreen] = useState<'landing' | 'login' | 'register'>('landing')
  if (!configured) return <>{children}</>
  if (loading) return <main className="auth-shell"><div className="auth-loader" aria-label="Authenticatie laden" /></main>
  if (!user) return publicScreen === 'landing'
    ? <LandingPage onLogin={() => setPublicScreen('login')} onRegister={() => setPublicScreen('register')} />
    : <AuthScreen initialMode={publicScreen} onBack={() => setPublicScreen('landing')} />
  if (!user.emailVerified) return <VerificationScreen user={user} />
  return <>{children}</>
}
