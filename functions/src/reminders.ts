import { getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { reminderMonthForDate } from './membershipDomain.js'

if (getApps().length === 0) initializeApp()
const db = getFirestore('kasgeld')

export const prepareMonthlyReminders = onSchedule({ region: 'southamerica-east1', schedule: '0 9 6 * *', timeZone: 'America/Cayenne', memory: '256MiB', timeoutSeconds: 120 }, async () => {
  const now = new Date()
  const monthLabel = reminderMonthForDate(now)
  if (!monthLabel) return
  const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  const groups = await db.collection('groups').where('notificationsEnabled', '==', true).get()
  let queued = 0
  for (const group of groups.docs) {
    const participants = await group.ref.collection('participants').where('assignedMonth', '==', monthLabel).get()
    for (const participant of participants.docs) {
      const phone = participant.get('phone') as string
      const pushTokens = await participant.ref.collection('pushTokens').limit(1).get()
      const whatsappEligible = participant.get('whatsappOptIn') === true && Boolean(phone)
      if (!whatsappEligible && pushTokens.empty) continue
      const outboxRef = group.ref.collection('notificationOutbox').doc(`${period}_${participant.id}`)
      await db.runTransaction(async transaction => {
        const existing = await transaction.get(outboxRef)
        if (existing.exists) return
        transaction.create(outboxRef, { participantId: participant.id, participantName: participant.get('name'), phone, whatsappEligible, monthLabel, period, channel: 'pending', status: 'queued', createdAt: FieldValue.serverTimestamp() })
        transaction.create(group.ref.collection('activities').doc(), { type: 'reminder_queued', actorUid: 'system', participantId: participant.id, participantName: participant.get('name'), monthLabel, period, createdAt: FieldValue.serverTimestamp() })
        queued += 1
      })
    }
  }
  logger.info('Monthly reminder outbox prepared', { period, monthLabel, queued })
})
