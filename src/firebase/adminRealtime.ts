import { collection, limit, onSnapshot, orderBy, query, type Unsubscribe } from 'firebase/firestore'
import { requireDb } from './client'

export type InvitationRecord = { id: string; status: string; usedBy?: string; expiresAt?: string }
export type OutboxRecord = { id: string; participantName: string; monthLabel: string; channel: string; status: string; period: string }

export function subscribeAdminData(groupId: string, onInvitations: (items: InvitationRecord[]) => void, onOutbox: (items: OutboxRecord[]) => void, onError: (error: Error) => void): Unsubscribe {
  const db = requireDb()
  const invitations = onSnapshot(query(collection(db, 'groups', groupId, 'invitations'), orderBy('createdAt', 'desc'), limit(20)), snapshot => onInvitations(snapshot.docs.map(document => ({ id: document.id, status: String(document.get('status') || 'unknown'), usedBy: document.get('usedBy'), expiresAt: document.get('expiresAt')?.toDate?.().toLocaleDateString('nl-NL') }))), onError)
  const outbox = onSnapshot(query(collection(db, 'groups', groupId, 'notificationOutbox'), orderBy('createdAt', 'desc'), limit(30)), snapshot => onOutbox(snapshot.docs.map(document => ({ id: document.id, participantName: String(document.get('participantName') || 'Deelnemer'), monthLabel: String(document.get('monthLabel') || ''), channel: String(document.get('channel') || 'pending'), status: String(document.get('status') || 'queued'), period: String(document.get('period') || '') }))), onError)
  return () => { invitations(); outbox() }
}
