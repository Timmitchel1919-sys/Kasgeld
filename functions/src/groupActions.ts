import { getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https'
import { parseGroupId, parseParticipantId } from './adminDomain.js'
import { hashInviteCode, normalizeInviteCode } from './membershipDomain.js'

if (getApps().length === 0) initializeApp()
const db = getFirestore('kasgeld')
const options = { region: 'southamerica-east1', memory: '256MiB' as const, timeoutSeconds: 30 }

function identity(request: CallableRequest) {
  if (!request.auth || request.auth.token.email_verified !== true) throw new HttpsError('permission-denied', 'Een geverifieerd account is verplicht.')
  const email = typeof request.auth.token.email === 'string' ? request.auth.token.email.toLowerCase() : ''
  const displayName = typeof request.auth.token.name === 'string' && request.auth.token.name.trim().length >= 2 ? request.auth.token.name.trim().slice(0, 80) : email.split('@')[0]
  if (!email) throw new HttpsError('failed-precondition', 'E-mailadres ontbreekt.')
  return { uid: request.auth.uid, email, displayName }
}

export const createGroup = onCall(options, async request => {
  const { uid, email, displayName } = identity(request)
  const name = typeof request.data?.name === 'string' ? request.data.name.trim().slice(0, 80) : ''
  if (name.length < 2) throw new HttpsError('invalid-argument', 'Vul een geldige groepsnaam in.')
  const groupRef = db.collection('groups').doc()
  const memberRef = groupRef.collection('members').doc(uid)
  const participantRef = groupRef.collection('participants').doc(uid)
  const userGroupRef = db.doc(`userGroups/${uid}/groups/${groupRef.id}`)
  await db.runTransaction(async transaction => {
    const now = FieldValue.serverTimestamp()
    transaction.create(groupRef, { name, ownerId: uid, currency: 'EUR', notificationsEnabled: true, createdAt: now, updatedAt: now })
    transaction.create(memberRef, { uid, email, displayName, role: 'owner', status: 'active', joinedAt: now })
    transaction.create(participantRef, { name: displayName, email, phone: '', role: 'owner', status: 'registered', memberStatus: 'active', assignedMonth: null, createdBy: uid, createdAt: now, updatedAt: now })
    transaction.create(userGroupRef, { groupId: groupRef.id, name, role: 'owner', status: 'active', joinedAt: now })
    transaction.create(groupRef.collection('activities').doc(), { type: 'group_created', actorUid: uid, participantId: uid, participantName: displayName, createdAt: now })
  })
  return { groupId: groupRef.id, name, role: 'owner' as const }
})

export const joinGroup = onCall(options, async request => {
  const { uid, email, displayName } = identity(request)
  const code = normalizeInviteCode(request.data?.inviteCode)
  if (!code) throw new HttpsError('invalid-argument', 'Uitnodigingscode ontbreekt.')
  const hash = hashInviteCode(code)
  const pointerRef = db.doc(`invitationCodes/${hash}`)
  const pointer = await pointerRef.get()
  if (!pointer.exists || pointer.get('status') !== 'active') throw new HttpsError('permission-denied', 'Uitnodigingscode is ongeldig of gebruikt.')
  const groupId = parseGroupId(pointer.get('groupId'))
  const groupRef = db.doc(`groups/${groupId}`)
  const inviteRef = groupRef.collection('invitations').doc(hash)
  const memberRef = groupRef.collection('members').doc(uid)
  const participantRef = groupRef.collection('participants').doc(uid)
  const userGroupRef = db.doc(`userGroups/${uid}/groups/${groupId}`)
  await db.runTransaction(async transaction => {
    const [group, invitation, member, pointerSnapshot] = await transaction.getAll(groupRef, inviteRef, memberRef, pointerRef)
    if (!group?.exists || !invitation?.exists || invitation.get('status') !== 'active' || !pointerSnapshot?.exists || pointerSnapshot.get('status') !== 'active') throw new HttpsError('permission-denied', 'Uitnodiging is niet geldig.')
    if (invitation.get('expiresAt').toMillis() <= Date.now()) throw new HttpsError('failed-precondition', 'Uitnodiging is verlopen.')
    const now = FieldValue.serverTimestamp()
    transaction.update(inviteRef, { status: 'used', usedBy: uid, usedAt: now })
    transaction.update(pointerRef, { status: 'used', usedBy: uid, usedAt: now })
    if (!member?.exists) transaction.create(memberRef, { uid, email, displayName, role: 'member', status: 'active', joinedAt: now })
    transaction.set(participantRef, { name: displayName, email, phone: '', role: 'member', status: 'registered', memberStatus: 'active', assignedMonth: null, createdBy: uid, createdAt: now, updatedAt: now }, { merge: true })
    transaction.set(userGroupRef, { groupId, name: group.get('name'), role: member?.exists ? member.get('role') : 'member', status: 'active', joinedAt: member?.exists ? member.get('joinedAt') : now }, { merge: true })
    transaction.create(groupRef.collection('activities').doc(), { type: 'user_joined_group', actorUid: uid, participantId: uid, participantName: displayName, createdAt: now })
  })
  return { groupId, name: pointer.get('groupName') ?? 'Kasgeld Groep', role: 'member' as const }
})

export const updateParticipantAccess = onCall(options, async request => {
  const { uid } = identity(request)
  let groupId: string, participantId: string
  try { groupId = parseGroupId(request.data?.groupId); participantId = parseParticipantId(request.data?.participantId) } catch { throw new HttpsError('invalid-argument', 'Ongeldige deelnemer.') }
  const role = request.data?.role
  const status = request.data?.status
  if (!['admin', 'member'].includes(role) || !['active', 'inactive'].includes(status)) throw new HttpsError('invalid-argument', 'Ongeldige rol of status.')
  const groupRef = db.doc(`groups/${groupId}`)
  const actorRef = groupRef.collection('members').doc(uid)
  const memberRef = groupRef.collection('members').doc(participantId)
  const participantRef = groupRef.collection('participants').doc(participantId)
  await db.runTransaction(async transaction => {
    const [group, actor, member, participant] = await transaction.getAll(groupRef, actorRef, memberRef, participantRef)
    if (!group?.exists || !actor?.exists || actor.get('status') !== 'active' || actor.get('role') !== 'owner') throw new HttpsError('permission-denied', 'Alleen de groepseigenaar mag rollen en toegang wijzigen.')
    if (!member?.exists || !participant?.exists) throw new HttpsError('not-found', 'Deelnemer bestaat niet.')
    if (participantId === group.get('ownerId')) throw new HttpsError('failed-precondition', 'De eigenaar kan niet worden gedeactiveerd of gedegradeerd.')
    if (status === 'inactive' && participant.get('assignedMonth') != null) throw new HttpsError('failed-precondition', 'Ontgrendel eerst de toegewezen maand.')
    transaction.update(memberRef, { role, status, updatedAt: FieldValue.serverTimestamp() })
    transaction.update(participantRef, { role, memberStatus: status, updatedAt: FieldValue.serverTimestamp() })
    transaction.set(db.doc(`userGroups/${participantId}/groups/${groupId}`), { groupId, name: group.get('name'), role, status, joinedAt: member.get('joinedAt') }, { merge: true })
    transaction.create(groupRef.collection('activities').doc(), { type: 'participant_access_updated', actorUid: uid, participantId, participantName: participant.get('name'), role, status, createdAt: FieldValue.serverTimestamp() })
  })
  return { groupId, participantId, role, status }
})
