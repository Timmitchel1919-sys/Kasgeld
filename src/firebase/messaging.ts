import { getMessaging, getToken, isSupported } from 'firebase/messaging'
import { httpsCallable } from 'firebase/functions'
import { requireFunctions } from './client'
import { firebaseApp } from './client'

export async function enablePushNotifications(groupId: string) {
  if (!await isSupported()) throw new Error('Pushmeldingen worden niet ondersteund in deze browser.')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Geef toestemming voor meldingen in je browserinstellingen.')
  if (!firebaseApp) throw new Error('Firebase is niet geconfigureerd.')
  const registration = await navigator.serviceWorker.ready
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
  const token = await getToken(getMessaging(firebaseApp), { serviceWorkerRegistration: registration, ...(vapidKey ? { vapidKey } : {}) })
  if (!token) throw new Error('Er kon geen push-token worden aangemaakt.')
  await httpsCallable<{ groupId: string; token: string }, { registered: boolean }>(requireFunctions(), 'registerPushToken')({ groupId, token })
  return true
}

export async function updateWhatsAppConsent(groupId: string, whatsappOptIn: boolean) {
  return (await httpsCallable<{ groupId: string; whatsappOptIn: boolean }, { whatsappOptIn: boolean }>(requireFunctions(), 'updateMessagingConsent')({ groupId, whatsappOptIn })).data
}
