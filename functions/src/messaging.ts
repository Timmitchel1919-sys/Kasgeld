import { createHash } from 'node:crypto'
import { getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https'
import { parseGroupId } from './adminDomain.js'

if (getApps().length === 0) initializeApp()
const db = getFirestore('kasgeld')
const region = 'southamerica-east1'

function verifiedUid(request: CallableRequest): string {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Log eerst in.')
  if (request.auth.token.email_verified !== true) throw new HttpsError('permission-denied', 'Verifieer eerst je e-mailadres.')
  return request.auth.uid
}

function validToken(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 32 && value.length <= 4096
}

export const registerPushToken = onCall({ region, memory: '256MiB', timeoutSeconds: 30 }, async request => {
  const uid = verifiedUid(request)
  let groupId: string
  try { groupId = parseGroupId(request.data?.groupId) } catch { throw new HttpsError('invalid-argument', 'Ongeldige groep.') }
  const token = request.data?.token
  if (!validToken(token)) throw new HttpsError('invalid-argument', 'Ongeldig push-token.')
  const participantRef = db.doc(`groups/${groupId}/participants/${uid}`)
  const memberRef = db.doc(`groups/${groupId}/members/${uid}`)
  const tokenId = createHash('sha256').update(token).digest('hex')
  await db.runTransaction(async transaction => {
    const [member, participant] = await transaction.getAll(memberRef, participantRef)
    if (!member?.exists || member.get('status') !== 'active' || !participant?.exists) throw new HttpsError('permission-denied', 'Je bent geen actieve deelnemer.')
    transaction.set(participantRef.collection('pushTokens').doc(tokenId), { token, platform: 'web', createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: true })
  })
  return { registered: true }
})
export const updateMessagingConsent = onCall({ region, memory: '256MiB', timeoutSeconds: 30 }, async request => {
  const uid = verifiedUid(request)
  let groupId: string
  try { groupId = parseGroupId(request.data?.groupId) } catch { throw new HttpsError('invalid-argument', 'Ongeldige groep.') }
  if (typeof request.data?.whatsappOptIn !== 'boolean') throw new HttpsError('invalid-argument', 'Ongeldige toestemmingswaarde.')
  const participantRef = db.doc(`groups/${groupId}/participants/${uid}`)
  const memberRef = db.doc(`groups/${groupId}/members/${uid}`)
  await db.runTransaction(async transaction => {
    const [member, participant] = await transaction.getAll(memberRef, participantRef)
    if (!member?.exists || member.get('status') !== 'active' || !participant?.exists) throw new HttpsError('permission-denied', 'Je bent geen actieve deelnemer.')
    transaction.update(participantRef, { whatsappOptIn: request.data.whatsappOptIn, whatsappOptInAt: request.data.whatsappOptIn ? FieldValue.serverTimestamp() : null, updatedAt: FieldValue.serverTimestamp() })
    transaction.create(participantRef.parent.parent!.collection('activities').doc(), { type: 'messaging_consent_updated', actorUid: uid, participantId: uid, participantName: participant.get('name'), whatsappOptIn: request.data.whatsappOptIn, createdAt: FieldValue.serverTimestamp() })
  })
  return { whatsappOptIn: request.data.whatsappOptIn as boolean }
})
// Provider delivery is isolated in messagingDispatch.ts so consent registration can deploy without Twilio secrets.
