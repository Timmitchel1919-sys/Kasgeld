import { getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore'
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https'
import { parseGroupId } from './adminDomain.js'
import { createInviteCode, hashInviteCode, normalizePhone } from './membershipDomain.js'

if (getApps().length === 0) initializeApp()
const db = getFirestore('kasgeld')
const options = { region: 'southamerica-east1', memory: '256MiB' as const, timeoutSeconds: 30, enforceAppCheck: process.env.ENFORCE_APP_CHECK === 'true' }

function verifiedUid(request: CallableRequest): string {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Log eerst in.')
  if (request.auth.token.email_verified !== true) throw new HttpsError('permission-denied', 'Verifieer eerst je e-mailadres.')
  return request.auth.uid
}

export const createInvitation = onCall(options, async request => {
  const uid = verifiedUid(request)
  let groupId: string
  try { groupId = parseGroupId(request.data?.groupId) } catch { throw new HttpsError('invalid-argument', 'Ongeldige groep.') }
  const groupRef = db.doc(`groups/${groupId}`)
  const memberRef = groupRef.collection('members').doc(uid)
  const code = createInviteCode()
  const inviteRef = groupRef.collection('invitations').doc(hashInviteCode(code))
  const invitationPointerRef = db.doc(`invitationCodes/${hashInviteCode(code)}`)
  await db.runTransaction(async transaction => {
    const [group, member] = await transaction.getAll(groupRef, memberRef)
    if (!group?.exists) throw new HttpsError('not-found', 'Groep bestaat niet.')
    if (!member?.exists || member.get('status') !== 'active' || !['owner', 'admin'].includes(member.get('role') as string)) throw new HttpsError('permission-denied', 'Alleen de administrator mag uitnodigingen maken.')
    transaction.create(inviteRef, { status: 'active', createdBy: uid, createdAt: FieldValue.serverTimestamp(), expiresAt: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000) })
    transaction.create(invitationPointerRef, { groupId, groupName: group.get('name'), status: 'active', expiresAt: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000) })
    transaction.create(groupRef.collection('activities').doc(), { type: 'invitation_created', actorUid: uid, createdAt: FieldValue.serverTimestamp() })
  })
  return { groupId, code, expiresInDays: 7 }
})

export const updateOwnPhone = onCall(options, async request => {
  const uid = verifiedUid(request)
  let groupId: string, phone: string
  try { groupId = parseGroupId(request.data?.groupId); phone = normalizePhone(request.data?.phone) }
  catch { throw new HttpsError('invalid-argument', 'Gebruik een geldig internationaal nummer, bijvoorbeeld +5978123456.') }
  const groupRef = db.doc(`groups/${groupId}`)
  const memberRef = groupRef.collection('members').doc(uid)
  const participantRef = groupRef.collection('participants').doc(uid)
  await db.runTransaction(async transaction => {
    const [member, participant] = await transaction.getAll(memberRef, participantRef)
    if (!member?.exists || member.get('status') !== 'active' || !participant?.exists) throw new HttpsError('permission-denied', 'Je bent geen actieve deelnemer.')
    transaction.update(participantRef, { phone, updatedAt: FieldValue.serverTimestamp() })
    transaction.create(groupRef.collection('activities').doc(), { type: 'phone_updated', actorUid: uid, participantId: uid, participantName: participant.get('name'), createdAt: FieldValue.serverTimestamp() })
  })
  return { groupId, phone }
})
