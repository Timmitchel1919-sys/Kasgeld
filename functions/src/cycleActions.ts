import { getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https'
import { parseGroupId, parseMonthId, parseParticipantId } from './adminDomain.js'
import { parseCycleSettings, parsePayoutAction } from './cycleDomain.js'

if (getApps().length === 0) initializeApp()
const db = getFirestore('kasgeld')
const options = { region: 'southamerica-east1', memory: '256MiB' as const, timeoutSeconds: 30 }

function uidOf(request: CallableRequest) {
  if (!request.auth || request.auth.token.email_verified !== true) throw new HttpsError('permission-denied', 'Een geverifieerd account is verplicht.')
  return request.auth.uid
}

export const updateCycleSettings = onCall(options, async request => {
  const uid = uidOf(request)
  let groupId: string
  try { groupId = parseGroupId(request.data?.groupId) } catch { throw new HttpsError('invalid-argument', 'Ongeldige groep.') }
  let cycleYear: number, monthlyContributionCents: number, payoutDay: number
  try { ({ cycleYear, monthlyContributionCents, payoutDay } = parseCycleSettings(request.data)) } catch { throw new HttpsError('invalid-argument', 'Ongeldige ronde-instellingen.') }
  const groupRef = db.doc(`groups/${groupId}`)
  await db.runTransaction(async transaction => {
    const [group, member] = await transaction.getAll(groupRef, groupRef.collection('members').doc(uid))
    if (!group?.exists || !member?.exists || member.get('status') !== 'active' || !['owner', 'admin'].includes(member.get('role'))) throw new HttpsError('permission-denied', 'Alleen beheer mag de ronde instellen.')
    transaction.update(groupRef, { cycleYear, monthlyContributionCents, payoutDay, updatedAt: FieldValue.serverTimestamp() })
    transaction.create(groupRef.collection('activities').doc(), { type: 'cycle_settings_updated', actorUid: uid, cycleYear, monthlyContributionCents, payoutDay, createdAt: FieldValue.serverTimestamp() })
  })
  return { cycleYear, monthlyContributionCents, payoutDay }
})

export const confirmPayout = onCall(options, async request => {
  const uid = uidOf(request)
  let groupId: string, monthId: string
  try { groupId = parseGroupId(request.data?.groupId); monthId = parseMonthId(request.data?.monthId) } catch { throw new HttpsError('invalid-argument', 'Ongeldige maand.') }
  let action: 'mark_paid' | 'confirm_received'
  try { action = parsePayoutAction(request.data?.action) } catch { throw new HttpsError('invalid-argument', 'Ongeldige bevestiging.') }
  const groupRef = db.doc(`groups/${groupId}`)
  const monthRef = groupRef.collection('months').doc(monthId)
  await db.runTransaction(async transaction => {
    const [member, month] = await transaction.getAll(groupRef.collection('members').doc(uid), monthRef)
    if (!member?.exists || member.get('status') !== 'active' || !month?.exists) throw new HttpsError('permission-denied', 'Geen toegang tot deze uitbetaling.')
    const participantId = month.get('participantId') as string
    if (action === 'mark_paid' && !['owner', 'admin'].includes(member.get('role'))) throw new HttpsError('permission-denied', 'Alleen beheer kan een uitbetaling markeren.')
    if (action === 'confirm_received' && uid !== participantId) throw new HttpsError('permission-denied', 'Alleen de ontvanger kan ontvangst bevestigen.')
    const now = FieldValue.serverTimestamp()
    transaction.update(monthRef, action === 'mark_paid' ? { adminPaidAt: now, adminPaidBy: uid } : { recipientConfirmedAt: now, recipientConfirmedBy: uid })
    transaction.create(groupRef.collection('activities').doc(), { type: action === 'mark_paid' ? 'payout_marked_paid' : 'payout_confirmed_received', actorUid: uid, participantId, participantName: month.get('participantName'), monthId, monthLabel: month.get('month'), createdAt: now })
  })
  return { groupId, monthId, action }
})

export const transferGroupOwnership = onCall(options, async request => {
  const uid = uidOf(request)
  let groupId: string, participantId: string
  try { groupId = parseGroupId(request.data?.groupId); participantId = parseParticipantId(request.data?.participantId) } catch { throw new HttpsError('invalid-argument', 'Ongeldige overdracht.') }
  if (uid === participantId) throw new HttpsError('failed-precondition', 'Je bent al eigenaar.')
  const groupRef = db.doc(`groups/${groupId}`)
  const oldMemberRef = groupRef.collection('members').doc(uid)
  const newMemberRef = groupRef.collection('members').doc(participantId)
  await db.runTransaction(async transaction => {
    const [group, oldMember, newMember] = await transaction.getAll(groupRef, oldMemberRef, newMemberRef)
    if (!group?.exists || group.get('ownerId') !== uid || oldMember?.get('role') !== 'owner') throw new HttpsError('permission-denied', 'Alleen de huidige eigenaar kan eigendom overdragen.')
    if (!newMember?.exists || newMember.get('status') !== 'active') throw new HttpsError('failed-precondition', 'De nieuwe eigenaar moet een actief lid zijn.')
    const now = FieldValue.serverTimestamp()
    transaction.update(groupRef, { ownerId: participantId, updatedAt: now })
    transaction.update(oldMemberRef, { role: 'admin', updatedAt: now })
    transaction.update(newMemberRef, { role: 'owner', updatedAt: now })
    transaction.update(groupRef.collection('participants').doc(uid), { role: 'admin', updatedAt: now })
    transaction.update(groupRef.collection('participants').doc(participantId), { role: 'owner', updatedAt: now })
    transaction.set(db.doc(`userGroups/${uid}/groups/${groupId}`), { role: 'admin' }, { merge: true })
    transaction.set(db.doc(`userGroups/${participantId}/groups/${groupId}`), { role: 'owner' }, { merge: true })
    transaction.create(groupRef.collection('activities').doc(), { type: 'ownership_transferred', actorUid: uid, participantId, participantName: newMember.get('displayName'), createdAt: now })
  })
  return { groupId, ownerId: participantId }
})

export const exportGroupData = onCall({ ...options, timeoutSeconds: 60 }, async request => {
  const uid = uidOf(request)
  let groupId: string
  try { groupId = parseGroupId(request.data?.groupId) } catch { throw new HttpsError('invalid-argument', 'Ongeldige groep.') }
  const groupRef = db.doc(`groups/${groupId}`)
  const [group, member] = await Promise.all([groupRef.get(), groupRef.collection('members').doc(uid).get()])
  if (!group.exists || !member.exists || member.get('status') !== 'active' || !['owner', 'admin'].includes(member.get('role'))) throw new HttpsError('permission-denied', 'Alleen beheer mag exporteren.')
  const [participants, months, activities] = await Promise.all([groupRef.collection('participants').get(), groupRef.collection('months').get(), groupRef.collection('activities').orderBy('createdAt', 'desc').limit(200).get()])
  const serialize = (snapshot: FirebaseFirestore.QuerySnapshot) => snapshot.docs.map(document => ({ id: document.id, ...document.data() }))
  return { exportedAt: new Date().toISOString(), group: { id: group.id, ...group.data() }, participants: serialize(participants), months: serialize(months), activities: serialize(activities) }
})
