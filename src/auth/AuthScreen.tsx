import { FormEvent, useState } from 'react'
import { LockKeyhole, Mail, UserRound } from 'lucide-react'
import { readableFirebaseError } from '../firebase/errors'
import { registerWithEmail, signInWithEmail, signInWithGoogle } from '../firebase/auth'

function GoogleMark() {
  return <svg className="google-mark" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285f4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.3Z" />
    <path fill="#34a853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1a5.8 5.8 0 0 1-5.5-4H3.2v2.6A10 10 0 0 0 12 22Z" />
    <path fill="#fbbc05" d="M6.5 14.1a6 6 0 0 1 0-4.2V7.3H3.2a10 10 0 0 0 0 9.4l3.3-2.6Z" />
    <path fill="#ea4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 3.2 7.3l3.3 2.6A5.8 5.8 0 0 1 12 5.9Z" />
  </svg>
}

export function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(''); setNotice(''); setBusy(true)
    try {
      if (mode === 'register') {
        if (name.trim().length < 2) throw new Error('Vul je volledige naam in.')
        if (password.length < 12) throw new Error('Gebruik een wachtwoord van minimaal twaalf tekens.')
        await registerWithEmail(email.trim(), password, name.trim())
        setNotice('Account aangemaakt. Controleer je e-mail om je account te verifiëren.')
      } else {
        await signInWithEmail(email.trim(), password)
      }
    } catch (caught) { setError(readableFirebaseError(caught)) }
    finally { setBusy(false) }
  }

  const googleSignIn = async () => {
    setError(''); setNotice(''); setBusy(true)
    try { await signInWithGoogle() }
    catch (caught) { setError(readableFirebaseError(caught)) }
    finally { setBusy(false) }
  }

  return <main className="auth-shell">
    <section className="auth-card">
      <div className="auth-brand"><div className="coin-logo" aria-hidden="true"><span>€</span><i>€</i><b>€</b></div><div><h1>Kasgeld Applicatie</h1><p>Samen eerlijk. Samen transparant.</p></div></div>
      <div className="auth-tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Inloggen</button><button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Registreren</button></div>
      <button className="google-auth-button" type="button" onClick={googleSignIn} disabled={busy}><GoogleMark />Doorgaan met Google</button>
      <div className="auth-divider"><span>of ga verder met e-mail</span></div>
      <form onSubmit={submit}>
        {mode === 'register' && <label><span>Naam</span><div><UserRound /><input value={name} onChange={e => setName(e.target.value)} autoComplete="name" required /></div></label>}
        <label><span>E-mailadres</span><div><Mail /><input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required /></div></label>
        <label><span>Wachtwoord</span><div><LockKeyhole /><input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required /></div></label>
        {error && <p className="auth-message error" role="alert">{error}</p>}
        {notice && <p className="auth-message success" role="status">{notice}</p>}
        <button className="auth-submit" disabled={busy}>{busy ? 'Even wachten…' : mode === 'login' ? 'Veilig inloggen' : 'Account aanmaken'}</button>
      </form>
    </section>
  </main>
}
