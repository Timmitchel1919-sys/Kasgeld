import { getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore, type DocumentReference, type Transaction } from 'firebase-admin/firestore'
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https'
import { monthById, monthIdByLabel, parseGroupId, parseMonthId, parseNotificationsEnabled, parseParticipantId } from './adminDomain.js'

if (getApps().length === 0) initializeApp()
const db = getFirestore('kasgeld')
const callableOptions = { region: 'southamerica-east1', memory: '256MiB' as const, timeoutSeconds: 30, enforceAppCheck: process.env.ENFORCE_APP_CHECK === 'true' }

function requireVerifiedUid(request: CallableRequest): string {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Log eerst in.')
  if (request.auth.token.email_verified !== true) throw new HttpsError('permission-denied', 'Verifieer eerst je e-mailadres.')
  return request.auth.uid
}

async function requireAdmin(transaction: Transaction, groupId: string, uid: string) {
  const groupRef = db.doc(`groups/${groupId}`)
  const memberRef = groupRef.collection('members').doc(uid)
  const [group, member] = await transaction.getAll(groupRef, memberRef)
  if (!group?.exists) throw new HttpsError('not-found', 'Groep bestaat niet.')
  if (!member?.exists || member.get('status') !== 'active' || !['owner', 'admin'].includes(member.get('role') as string)) {
    throw new HttpsError('permission-denied', 'Alleen de administrator mag deze actie uitvoeren.')
  }
  return groupRef
}

function activity(groupRef: DocumentReference) {
  return groupRef.collection('activities').doc()
}

export const unlockMonth = onCall(callableOptions, async request => {
  const uid = requireVerifiedUid(request)
  let groupId: string, monthId: string
  try { groupId = parseGroupId(request.data?.groupId); monthId = parseMonthId(request.data?.monthId) }
  catch { throw new HttpsError('invalid-argument', 'Ongeldige ontgrendelaanvraag.') }
  await db.runTransaction(async transaction => {
    const groupRef = await requireAdmin(transaction, groupId, uid)
    const monthRef = groupRef.collection('months').doc(monthId)
    const monthSnapshot = await transaction.get(monthRef)
    if (!monthSnapshot.exists) return
    const participantId = monthSnapshot.get('participantId') as string
    const participantRef = groupRef.collection('participants').doc(participantId)
    const participant = await transaction.get(participantRef)
    transaction.delete(monthRef)
    if (participant.exists) transaction.update(participantRef, { assignedMonth: null, updatedAt: FieldValue.serverTimestamp() })
    transaction.create(activity(groupRef), { type: 'month_unlocked', actorUid: uid, participantId, participantName: monthSnapshot.get('participantName') ?? '', monthId, monthLabel: monthSnapshot.get('month'), createdAt: FieldValue.serverTimestamp() })
  })
  return { groupId, monthId }
})

export const assignMonth = onCall(callableOptions, async request => {
  const uid = requireVerifiedUid(request)
  let groupId: string, monthId: string, participantId: string
  try { groupId = parseGroupId(request.data?.groupId); monthId = parseMonthId(request.data?.monthId); participantId = parseParticipantId(request.data?.participantId) }
  catch { throw new HttpsError('invalid-argument', 'Ongeldige maandtoewijzing.') }
  const selectedMonth = monthById(monthId)
  await db.runTransaction(async transaction => {
    const groupRef = await requireAdmin(transaction, groupId, uid)
    const participantRef = groupRef.collection('participants').doc(participantId)
    const selectedRef = groupRef.collection('months').doc(monthId)
    const [participant, selectedAssignment] = await transaction.getAll(participantRef, selectedRef)
    if (!participant?.exists || participant.get('status') !== 'registered') throw new HttpsError('not-found', 'Deelnemer bestaat niet of is niet actief.')
    const previousMonthId = monthIdByLabel(participant.get('assignedMonth'))
    if (previousMonthId === monthId) return

    const occupantId = selectedAssignment?.exists ? selectedAssignment.get('participantId') as string : null
    const occupantRef = occupantId ? groupRef.collection('participants').doc(occupantId) : null
    const previousRef = previousMonthId ? groupRef.collection('months').doc(previousMonthId) : null
    const extraRefs = [occupantRef, previousRef].filter((ref): ref is DocumentReference => Boolean(ref))
    const extras = extraRefs.length ? await transaction.getAll(...extraRefs) : []
    const occupant = occupantRef ? extras[extraRefs.indexOf(occupantRef)] : undefined

    if (previousRef) transaction.delete(previousRef)
    if (occupantId && occupantRef && occupant?.exists) {
      const occupantName = occupant.get('name') as string
      if (previousMonthId && previousRef) {
        const previousMonth = monthById(previousMonthId)
        transaction.set(previousRef, { month: previousMonth.label, participantId: occupantId, participantName: occupantName, assignedBy: uid, assignedAt: FieldValue.serverTimestamp(), locked: true })
        transaction.update(occupantRef, { assignedMonth: previousMonth.label, updatedAt: FieldValue.serverTimestamp() })
      } else {
        transaction.update(occupantRef, { assignedMonth: null, updatedAt: FieldValue.serverTimestamp() })
      }
    }
    transaction.set(selectedRef, { month: selectedMonth.label, participantId, participantName: participant.get('name'), assignedBy: uid, assignedAt: FieldValue.serverTimestamp(), locked: true })
    transaction.update(participantRef, { assignedMonth: selectedMonth.label, updatedAt: FieldValue.serverTimestamp() })
    transaction.create(activity(groupRef), { type: 'month_reassigned', actorUid: uid, participantId, participantName: participant.get('name'), monthId, monthLabel: selectedMonth.label, swappedParticipantId: occupantId, createdAt: FieldValue.serverTimestamp() })
  })
  return { groupId, monthId, participantId }
})

export const resetWheel = onCall(callableOptions, async request => {
  const uid = requireVerifiedUid(request)
  let groupId: string
  try { groupId = parseGroupId(request.data?.groupId) } catch { throw new HttpsError('invalid-argument', 'Ongeldige resetaanvraag.') }
  await db.runTransaction(async transaction => {
    const groupRef = await requireAdmin(transaction, groupId, uid)
    const [months, participants] = await Promise.all([
      transaction.get(groupRef.collection('months')),
      transaction.get(groupRef.collection('participants')),
    ])
    months.docs.forEach(snapshot => transaction.delete(snapshot.ref))
    participants.docs.filter(snapshot => snapshot.get('assignedMonth') != null).forEach(snapshot => transaction.update(snapshot.ref, { assignedMonth: null, updatedAt: FieldValue.serverTimestamp() }))
    transaction.create(activity(groupRef), { type: 'wheel_reset', actorUid: uid, createdAt: FieldValue.serverTimestamp() })
  })
  return { groupId }
})

export const updateGroupSettings = onCall(callableOptions, async request => {
  const uid = requireVerifiedUid(request)
  let groupId: string, notificationsEnabled: boolean
  try { groupId = parseGroupId(request.data?.groupId); notificationsEnabled = parseNotificationsEnabled(request.data?.notificationsEnabled) }
  catch { throw new HttpsError('invalid-argument', 'Ongeldige groepsinstelling.') }
  await db.runTransaction(async transaction => {
    const groupRef = await requireAdmin(transaction, groupId, uid)
    transaction.update(groupRef, { notificationsEnabled, updatedAt: FieldValue.serverTimestamp() })
    transaction.create(activity(groupRef), { type: 'settings_updated', actorUid: uid, notificationsEnabled, createdAt: FieldValue.serverTimestamp() })
  })
  return { groupId, notificationsEnabled }
})
