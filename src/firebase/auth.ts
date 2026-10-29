import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { requireAuth, requireDb } from './client'

export function observeAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(requireAuth(), callback)
}
export async function registerWithEmail(email: string, password: string, displayName: string) {
  const credential = await createUserWithEmailAndPassword(requireAuth(), email, password)
  await updateProfile(credential.user, { displayName })
  await sendEmailVerification(credential.user)
  return credential.user
}

export async function signInWithEmail(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(requireAuth(), email, password)
  await reload(credential.user)
  if (credential.user.emailVerified) await ensureUserProfile(credential.user)
  return credential.user
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const credential = await signInWithPopup(requireAuth(), provider)
  await credential.user.getIdToken(true)
  await ensureUserProfile(credential.user)
  return credential.user
}

export async function resendVerification(user: User) {
  await sendEmailVerification(user)
}

export async function refreshCurrentUser(user: User) {
  await reload(user)
  await user.getIdToken(true)
  if (user.emailVerified) await ensureUserProfile(user)
  return user
}

export async function ensureUserProfile(user: User) {
  if (!user.emailVerified) throw new Error('Verifieer eerst je e-mailadres.')
  if (!user.email) throw new Error('Google heeft geen e-mailadres beschikbaar gesteld.')
  const profileRef = doc(requireDb(), 'users', user.uid)
  const existingProfile = await getDoc(profileRef)
  const displayName = user.displayName?.trim() || user.email.split('@')[0] || 'Gebruiker'
  const safeDisplayName = displayName.length >= 2 ? displayName.slice(0, 80) : 'Gebruiker'
  await setDoc(profileRef, {
    uid: user.uid,
    email: user.email,
    displayName: safeDisplayName,
    ...(!existingProfile.exists() && { createdAt: serverTimestamp() }),
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

export async function signOutCurrentUser() {
  await signOut(requireAuth())
}

