import { collection, onSnapshot, orderBy, query, type Unsubscribe } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { requireDb, requireFunctions } from './client'

export type GroupSummary = { id: string; name: string; role: 'owner' | 'admin' | 'member'; status: 'active' | 'inactive' }

export function subscribeUserGroups(uid: string, onGroups: (groups: GroupSummary[]) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(query(collection(requireDb(), 'userGroups', uid, 'groups'), orderBy('joinedAt', 'asc')), snapshot => onGroups(snapshot.docs.map(document => ({ id: document.id, name: String(document.get('name') || 'Kasgeld Groep'), role: document.get('role') as GroupSummary['role'], status: document.get('status') as GroupSummary['status'] })).filter(group => group.status === 'active')), onError)
}

export async function createKasgeldGroup(name: string) {
  return (await httpsCallable<{ name: string }, GroupSummary & { groupId: string }>(requireFunctions(), 'createGroup')({ name })).data
}

export async function joinKasgeldGroup(inviteCode: string) {
  return (await httpsCallable<{ inviteCode: string }, GroupSummary & { groupId: string }>(requireFunctions(), 'joinGroup')({ inviteCode })).data
}

export async function updateParticipantAccess(groupId: string, participantId: string, role: 'admin' | 'member', status: 'active' | 'inactive') {
  return (await httpsCallable<{ groupId: string; participantId: string; role: string; status: string }, unknown>(requireFunctions(), 'updateParticipantAccess')({ groupId, participantId, role, status })).data
}
