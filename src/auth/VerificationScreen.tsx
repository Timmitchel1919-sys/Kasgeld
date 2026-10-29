import { useState } from 'react'
import type { User } from 'firebase/auth'
import { MailCheck } from 'lucide-react'
import { readableFirebaseError } from '../firebase/errors'
import { refreshCurrentUser, resendVerification, signOutCurrentUser } from '../firebase/auth'

export function VerificationScreen({ user }: { user: User }) {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const action = async (fn: () => Promise<unknown>, success: string) => { setError(''); try { await fn(); setMessage(success) } catch (e) { setError(readableFirebaseError(e)) } }
  return <main className="auth-shell"><section className="auth-card verify-card"><MailCheck size={52} /><h1>Verifieer je e-mailadres</h1><p>We hebben een verificatielink gestuurd naar <strong>{user.email}</strong>. Zonder verificatie krijgt je account geen toegang tot groepsgegevens.</p>
    {message && <p className="auth-message success">{message}</p>}{error && <p className="auth-message error">{error}</p>}
    <button className="auth-submit" onClick={() => action(() => refreshCurrentUser(user), 'Accountstatus vernieuwd.')}>Ik heb mijn e-mail geverifieerd</button>
    <button className="auth-secondary" onClick={() => action(() => resendVerification(user), 'Nieuwe verificatiemail verzonden.')}>Verificatiemail opnieuw sturen</button>
    <button className="auth-link" onClick={signOutCurrentUser}>Uitloggen</button>
  </section></main>
}
