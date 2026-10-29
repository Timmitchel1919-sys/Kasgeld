import { getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { chooseMonth, hasActiveSpinLock, MONTHS, parseSpinInput } from './domain.js'

if (getApps().length === 0) initializeApp()

const db = getFirestore('kasgeld')
const enforceAppCheck = process.env.ENFORCE_APP_CHECK === 'true'

type SpinResult = {
  groupId: string
  participantId: string
  monthId: string
  monthLabel: string
  idempotencyKey: string
  replayed: boolean
}

export const spinMonth = onCall(
  {
    region: 'southamerica-east1',
    memory: '256MiB',
    timeoutSeconds: 30,
    maxInstances: 10,
    concurrency: 40,
    enforceAppCheck,
  },
  async request => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Log eerst in.')
    if (request.auth.token.email_verified !== true) throw new HttpsError('permission-denied', 'Verifieer eerst je e-mailadres.')

    let input
    try { input = parseSpinInput(request.data) }
    catch { throw new HttpsError('invalid-argument', 'Ongeldige spin-aanvraag.') }

    const uid = request.auth.uid
    const groupRef = db.doc(`groups/${input.groupId}`)
    const memberRef = groupRef.collection('members').doc(uid)
    const participantRef = groupRef.collection('participants').doc(input.participantId)
    const requestRef = groupRef.collection('spinRequests').doc(input.idempotencyKey)
    const activityRef = groupRef.collection('activities').doc()
    const monthRefs = MONTHS.map(month => groupRef.collection('months').doc(month.id))

    try {
      const result = await db.runTransaction<SpinResult>(async transaction => {
        const snapshots = await transaction.getAll(groupRef, memberRef, participantRef, requestRef, ...monthRefs)
        const [groupSnapshot, memberSnapshot, participantSnapshot, requestSnapshot, ...monthSnapshots] = snapshots

        if (!groupSnapshot || !memberSnapshot || !participantSnapshot || !requestSnapshot || monthSnapshots.length !== MONTHS.length) {
          throw new HttpsError('internal', 'De transactiestatus kon niet volledig worden geladen.')
        }

        if (!groupSnapshot.exists) throw new HttpsError('not-found', 'Groep bestaat niet.')
        if (!memberSnapshot.exists || memberSnapshot.get('status') !== 'active') throw new HttpsError('permission-denied', 'Je bent geen actief groepslid.')

        if (requestSnapshot.exists) {
          if (requestSnapshot.get('requestedBy') !== uid || requestSnapshot.get('participantId') !== input.participantId) {
            throw new HttpsError('already-exists', 'Deze idempotency key is al voor een andere aanvraag gebruikt.')
          }
          return {
            groupId: input.groupId,
            participantId: input.participantId,
            monthId: requestSnapshot.get('monthId') as string,
            monthLabel: requestSnapshot.get('monthLabel') as string,
            idempotencyKey: input.idempotencyKey,
            replayed: true,
          }
        }

        const nowMillis = Date.now()
        const spinLockedUntil = groupSnapshot.get('spinLockedUntil') as Timestamp | undefined
        if (hasActiveSpinLock(spinLockedUntil?.toMillis(), nowMillis)) {
          throw new HttpsError('resource-exhausted', 'Een andere deelnemer draait nu. Wacht enkele seconden en probeer opnieuw.')
        }

        if (!participantSnapshot.exists) throw new HttpsError('not-found', 'Deelnemer bestaat niet.')
        if (participantSnapshot.get('status') !== 'registered') throw new HttpsError('failed-precondition', 'De deelnemer is niet actief geregistreerd.')
        if (participantSnapshot.get('assignedMonth') != null) throw new HttpsError('failed-precondition', 'Deze deelnemer heeft al gedraaid.')

        const assignedIds = new Set(monthSnapshots.filter(snapshot => snapshot?.exists).map(snapshot => snapshot!.id))
        const availableMonths = MONTHS.filter(month => !assignedIds.has(month.id))
        if (availableMonths.length === 0) throw new HttpsError('failed-precondition', 'Alle maanden zijn al toegewezen.')
        const selectedMonth = chooseMonth(availableMonths)
        const selectedMonthRef = groupRef.collection('months').doc(selectedMonth.id)
        const now = FieldValue.serverTimestamp()
        const participantName = participantSnapshot.get('name') as string

        transaction.create(selectedMonthRef, {
          month: selectedMonth.label,
          participantId: input.participantId,
          participantName,
          assignedBy: uid,
          assignedAt: now,
          locked: true,
        })
        transaction.update(groupRef, { spinLockedBy: uid, spinLockedUntil: Timestamp.fromMillis(nowMillis + 4000), updatedAt: now })
        transaction.update(participantRef, { assignedMonth: selectedMonth.label, updatedAt: now })
        transaction.create(activityRef, {
          type: 'month_assigned',
          actorUid: uid,
          participantId: input.participantId,
          participantName,
          monthId: selectedMonth.id,
          monthLabel: selectedMonth.label,
          createdAt: now,
        })
        transaction.create(requestRef, {
          requestedBy: uid,
          participantId: input.participantId,
          monthId: selectedMonth.id,
          monthLabel: selectedMonth.label,
          createdAt: now,
        })

        return {
          groupId: input.groupId,
          participantId: input.participantId,
          monthId: selectedMonth.id,
          monthLabel: selectedMonth.label,
          idempotencyKey: input.idempotencyKey,
          replayed: false,
        }
      })

      logger.info('Month assigned', {
        groupId: result.groupId,
        participantId: result.participantId,
        monthId: result.monthId,
        requestedBy: uid,
        replayed: result.replayed,
      })
      return result
    } catch (error) {
      if (error instanceof HttpsError) throw error
      logger.error('Month assignment transaction failed', { groupId: input.groupId, participantId: input.participantId, requestedBy: uid, error })
      throw new HttpsError('internal', 'De maandloting kon niet veilig worden afgerond. Probeer opnieuw met dezelfde aanvraag.')
    }
  },
)
