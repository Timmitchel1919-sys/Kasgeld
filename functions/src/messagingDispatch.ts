import { getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { logger } from 'firebase-functions'
import { defineSecret } from 'firebase-functions/params'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'

if (getApps().length === 0) initializeApp()
const db = getFirestore('kasgeld')
const region = 'southamerica-east1'
const twilioAccountSid = defineSecret('TWILIO_ACCOUNT_SID')
const twilioAuthToken = defineSecret('TWILIO_AUTH_TOKEN')
const twilioWhatsAppFrom = defineSecret('TWILIO_WHATSAPP_FROM')
const twilioContentSid = defineSecret('TWILIO_CONTENT_SID')

function validToken(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 32 && value.length <= 4096
}

async function sendWhatsApp(phone: string, participantName: string, monthLabel: string) {
  const sid = twilioAccountSid.value()
  const token = twilioAuthToken.value()
  const from = twilioWhatsAppFrom.value()
  const contentSid = twilioContentSid.value()
  const body = new URLSearchParams({ To: `whatsapp:${phone}`, From: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`, ContentSid: contentSid, ContentVariables: JSON.stringify({ 1: participantName, 2: monthLabel }) })
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, { method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  if (!response.ok) throw new Error(`twilio-${response.status}`)
  return await response.json() as { sid: string; status: string }
}

export const dispatchNotification = onDocumentCreated({ document: 'groups/{groupId}/notificationOutbox/{messageId}', database: 'kasgeld', region, memory: '256MiB', timeoutSeconds: 60, secrets: [twilioAccountSid, twilioAuthToken, twilioWhatsAppFrom, twilioContentSid] }, async event => {
  const snapshot = event.data
  if (!snapshot) return
  const data = snapshot.data()
  const participantRef = db.doc(`groups/${event.params.groupId}/participants/${data.participantId}`)
  if (data.whatsappEligible === true) {
    try {
      const result = await sendWhatsApp(data.phone as string, data.participantName as string, data.monthLabel as string)
      await snapshot.ref.update({ channel: 'whatsapp', status: 'sent', providerMessageId: result.sid, providerStatus: result.status, sentAt: FieldValue.serverTimestamp() })
      return
    } catch (error) {
      logger.error('WhatsApp delivery failed; using push fallback', { groupId: event.params.groupId, messageId: event.params.messageId, error })
    }
  }
  const tokens = await participantRef.collection('pushTokens').get()
  const tokenValues = tokens.docs.map(document => document.get('token')).filter(validToken)
  if (!tokenValues.length) {
    await snapshot.ref.update({ channel: 'none', status: 'failed_no_channel', failedAt: FieldValue.serverTimestamp() })
    return
  }
  const result = await getMessaging().sendEachForMulticast({ tokens: tokenValues, notification: { title: 'Kasgeld herinnering', body: `${data.participantName}, je kasgeld-uitbetaling voor ${data.monthLabel} staat gepland.` }, webpush: { fcmOptions: { link: '/' } }, data: { groupId: event.params.groupId, monthLabel: String(data.monthLabel ?? '') } })
  await snapshot.ref.update({ channel: 'push', status: result.successCount > 0 ? 'sent' : 'failed', pushSuccessCount: result.successCount, pushFailureCount: result.failureCount, sentAt: FieldValue.serverTimestamp() })
})
