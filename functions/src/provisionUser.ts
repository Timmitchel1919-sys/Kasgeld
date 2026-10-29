import { getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { hashInviteCode, normalizeInviteCode } from './membershipDomain.js'

if (getApps().length === 0) initializeApp()

const db = getFirestore('kasgeld')
export const MAIN_GROUP_ID = 'kasgeld-main'
export const ADMIN_EMAIL = 'sheq97@gmail.com'

export function roleForEmail(email: string): 'owner' | 'member' {
  return email.trim().toLowerCase() === ADMIN_EMAIL ? 'owner' : 'member'
}

export function safeDisplayName(displayName: unknown, email: string): string {
  const candidate = typeof displayName === 'string' ? displayName.trim() : ''
  const fallback = email.split('@')[0] || 'Deelnemer'
  return (candidate.length >= 2 ? candidate : fallback).slice(0, 80)
}

export const provisionUser = onCall({ region: 'southamerica-east1', memory: '256MiB', timeoutSeconds: 30 }, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Log eerst in.')
  if (request.auth.token.email_verified !== true) throw new HttpsError('permission-denied', 'Verifieer eerst je e-mailadres.')
  const email = typeof request.auth.token.email === 'string' ? request.auth.token.email.toLowerCase() : ''
  if (!email) throw new HttpsError('failed-precondition', 'Het account heeft geen geldig e-mailadres.')

  const uid = request.auth.uid
  const role = roleForEmail(email)
  const displayName = safeDisplayName(request.auth.token.name, email)
  const inviteCode = normalizeInviteCode(request.data?.inviteCode)
  const groupRef = db.doc(`groups/${MAIN_GROUP_ID}`)
  const memberRef = groupRef.collection('members').doc(uid)
  const participantRef = groupRef.collection('participants').doc(uid)
  const activityRef = groupRef.collection('activities').doc()
  const userGroupRef = db.doc(`userGroups/${uid}/groups/${MAIN_GROUP_ID}`)
  const inviteRef = inviteCode ? groupRef.collection('invitations').doc(hashInviteCode(inviteCode)) : null

  await db.runTransaction(async transaction => {
    const refs = inviteRef ? [groupRef, memberRef, participantRef, inviteRef] : [groupRef, memberRef, participantRef]
    const snapshots = await transaction.getAll(...refs)
    const group = snapshots[0]!
    const member = snapshots[1]!
    const participant = snapshots[2]!
    const invitation = snapshots[3]
    if (!group.exists) {
      if (role !== 'owner') throw new HttpsError('failed-precondition', 'De administrator moet de Kasgeld-groep eerst initialiseren.')
      transaction.create(groupRef, { name: 'Kasgeld Groep', ownerId: uid, currency: 'EUR', notificationsEnabled: true, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() })
    } else if (role === 'owner' && group.get('ownerId') !== uid) {
      throw new HttpsError('permission-denied', 'Dit administratoraccount is niet de eigenaar van deze groep.')
    }
    if (!member.exists && role !== 'owner') {
      if (!inviteRef || !invitation?.exists || invitation.get('status') !== 'active') throw new HttpsError('permission-denied', 'Een geldige uitnodigingscode is verplicht.')
      const expiresAt = invitation.get('expiresAt')
      if (!expiresAt || expiresAt.toMillis() <= Date.now()) throw new HttpsError('failed-precondition', 'Deze uitnodiging is verlopen.')
      transaction.update(inviteRef, { status: 'used', usedBy: uid, usedAt: FieldValue.serverTimestamp() })
    }
    if (!member.exists) transaction.create(memberRef, { uid, email, displayName, role, status: 'active', joinedAt: FieldValue.serverTimestamp() })
    transaction.set(userGroupRef, { groupId: MAIN_GROUP_ID, name: group.exists ? group.get('name') : 'Kasgeld Groep', role, status: 'active', joinedAt: member.exists ? member.get('joinedAt') : FieldValue.serverTimestamp() }, { merge: true })
    if (!participant.exists) {
      transaction.create(participantRef, { name: displayName, email, phone: '', role, status: 'registered', memberStatus: 'active', assignedMonth: null, createdBy: uid, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() })
      transaction.create(activityRef, { type: 'user_registered', actorUid: uid, participantId: uid, participantName: displayName, createdAt: FieldValue.serverTimestamp() })
    }
  })

  return { groupId: MAIN_GROUP_ID, participantId: uid, role }
})
