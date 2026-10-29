import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { requireDb } from './client'

export async function createGroup(user: User, name: string) {
  if (!user.emailVerified) throw new Error('Verifieer eerst je e-mailadres.')
  const db = requireDb()
  const groupRef = doc(collection(db, 'groups'))
  const memberRef = doc(db, 'groups', groupRef.id, 'members', user.uid)
  const batch = writeBatch(db)

  batch.set(groupRef, {
    name: name.trim(),
    ownerId: user.uid,
    currency: 'EUR',
    notificationsEnabled: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  batch.set(memberRef, {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || 'Eigenaar',
    role: 'owner',
    status: 'active',
    joinedAt: serverTimestamp(),
  })
  await batch.commit()
  return groupRef.id
}
