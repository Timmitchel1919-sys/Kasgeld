import { getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https'
import { parseGroupId } from './adminDomain.js'
import { canCancelNotification, canRetryNotification, parseInvitationId, parseOutboxId } from './operationsDomain.js'

if (getApps().length === 0) initializeApp()
const db = getFirestore('kasgeld')
const options = { region: 'southamerica-east1', memory: '256MiB' as const, timeoutSeconds: 30, enforceAppCheck: process.env.ENFORCE_APP_CHECK === 'true' }

function verifiedUid(request: CallableRequest): string {
  if (!request.auth || request.auth.token.email_verified !== true) throw new HttpsError('permission-denied', 'Een geverifieerd account is verplicht.')
  return request.auth.uid
}

function assertAdmin(member: FirebaseFirestore.DocumentSnapshot) {
  if (!member.exists || member.get('status') !== 'active' || !['owner', 'admin'].includes(String(member.get('role')))) throw new HttpsError('permission-denied', 'Alleen beheer mag deze actie uitvoeren.')
}

export const revokeInvitation = onCall(options, async request => {
  const uid = verifiedUid(request)
  let groupId: string, invitationId: string
  try { groupId = parseGroupId(request.data?.groupId); invitationId = parseInvitationId(request.data?.invitationId) } catch { throw new HttpsError('invalid-argument', 'Ongeldige uitnodiging.') }
  const groupRef = db.doc(`groups/${groupId}`)
  const memberRef = groupRef.collection('members').doc(uid)
  const inviteRef = groupRef.collection('invitations').doc(invitationId)
  const pointerRef = db.doc(`invitationCodes/${invitationId}`)
  await db.runTransaction(async transaction => {
    const [member, invite] = await transaction.getAll(memberRef, inviteRef)
    if (!member || !invite) throw new HttpsError('internal', 'Uitnodiging kon niet worden geladen.')
    assertAdmin(member)
    if (!invite.exists) throw new HttpsError('not-found', 'Uitnodiging bestaat niet.')
    if (invite.get('status') !== 'active') throw new HttpsError('failed-precondition', 'Alleen een actieve uitnodiging kan worden ingetrokken.')
    const now = FieldValue.serverTimestamp()
    transaction.update(inviteRef, { status: 'revoked', revokedBy: uid, revokedAt: now })
    transaction.set(pointerRef, { status: 'revoked', revokedAt: now }, { merge: true })
    transaction.create(groupRef.collection('activities').doc(), { type: 'invitation_revoked', actorUid: uid, invitationId, createdAt: now })
  })
  return { invitationId, status: 'revoked' as const }
})

export const retryNotification = onCall(options, async request => {
  const uid = verifiedUid(request)
  let groupId: string, messageId: string
  try { groupId = parseGroupId(request.data?.groupId); messageId = parseOutboxId(request.data?.messageId) } catch { throw new HttpsError('invalid-argument', 'Ongeldig bericht.') }
  const groupRef = db.doc(`groups/${groupId}`)
  const memberRef = groupRef.collection('members').doc(uid)
  const sourceRef = groupRef.collection('notificationOutbox').doc(messageId)
  const retryRef = groupRef.collection('notificationOutbox').doc()
  await db.runTransaction(async transaction => {
    const [member, source] = await transaction.getAll(memberRef, sourceRef)
    if (!member || !source) throw new HttpsError('internal', 'Bericht kon niet worden geladen.')
    assertAdmin(member)
    if (!source.exists) throw new HttpsError('not-found', 'Bericht bestaat niet.')
    if (!canRetryNotification(source.get('status'))) throw new HttpsError('failed-precondition', 'Dit bericht kan niet opnieuw worden aangeboden.')
    const data = source.data()!
    const now = FieldValue.serverTimestamp()
    transaction.update(sourceRef, { status: 'retried', retriedBy: uid, retriedAt: now, retryMessageId: retryRef.id })
    transaction.create(retryRef, { participantId: data.participantId, participantName: data.participantName, phone: data.phone, monthId: data.monthId, monthLabel: data.monthLabel, period: data.period, whatsappEligible: data.whatsappEligible === true, channel: 'pending', status: 'queued', retryOf: messageId, createdAt: now })
    transaction.create(groupRef.collection('activities').doc(), { type: 'notification_retried', actorUid: uid, participantId: data.participantId, participantName: data.participantName, messageId: retryRef.id, createdAt: now })
  })
  return { messageId: retryRef.id, status: 'queued' as const }
})

export const cancelNotification = onCall(options, async request => {
  const uid = verifiedUid(request)
  let groupId: string, messageId: string
  try { groupId = parseGroupId(request.data?.groupId); messageId = parseOutboxId(request.data?.messageId) } catch { throw new HttpsError('invalid-argument', 'Ongeldig bericht.') }
  const groupRef = db.doc(`groups/${groupId}`)
  const memberRef = groupRef.collection('members').doc(uid)
  const messageRef = groupRef.collection('notificationOutbox').doc(messageId)
  await db.runTransaction(async transaction => {
    const [member, message] = await transaction.getAll(memberRef, messageRef)
    if (!member || !message) throw new HttpsError('internal', 'Bericht kon niet worden geladen.')
    assertAdmin(member)
    if (!message.exists) throw new HttpsError('not-found', 'Bericht bestaat niet.')
    if (!canCancelNotification(message.get('status'))) throw new HttpsError('failed-precondition', 'Dit bericht kan niet worden geannuleerd.')
    const now = FieldValue.serverTimestamp()
    transaction.update(messageRef, { status: 'cancelled', cancelledBy: uid, cancelledAt: now })
    transaction.create(groupRef.collection('activities').doc(), { type: 'notification_cancelled', actorUid: uid, messageId, createdAt: now })
  })
  return { messageId, status: 'cancelled' as const }
})
