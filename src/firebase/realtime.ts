import { collection, doc, limit, onSnapshot, orderBy, query, type DocumentData, type QueryDocumentSnapshot, type Unsubscribe } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { requireDb, requireFunctions } from './client'
import type { Activity, Participant } from '../types'
import type { CycleSettings } from './cycle'

export const MAIN_GROUP_ID = 'kasgeld-main'

type ProvisionResult = { groupId: string; participantId: string; role: 'owner' | 'member' }
type RealtimeHandlers = {
  onParticipants: (participants: Participant[]) => void
  onActivities: (activities: Activity[]) => void
  onNotificationsEnabled: (enabled: boolean) => void
  onCycleSettings?: (settings: CycleSettings) => void
  onPayoutStatuses?: (statuses: Record<string, { adminPaid: boolean; recipientConfirmed: boolean; participantId: string }>) => void
  onError: (error: Error) => void
}

const colors = ['#8d4d21', '#913f66', '#397889', '#4a506e', '#463b33', '#1565a8']
const participantFromSnapshot = (snapshot: QueryDocumentSnapshot<DocumentData>, index: number): Participant => {
  const data = snapshot.data()
  const name = typeof data.name === 'string' ? data.name : 'Deelnemer'
  return { id: snapshot.id, name, email: typeof data.email === 'string' ? data.email : undefined, phone: typeof data.phone === 'string' && data.phone ? data.phone : 'Nog niet geregistreerd', initials: name[0]?.toUpperCase() || 'D', color: colors[index % colors.length], assignedMonth: typeof data.assignedMonth === 'string' ? data.assignedMonth : undefined, whatsappOptIn: data.whatsappOptIn === true, role: ['owner', 'admin', 'member'].includes(data.role) ? data.role : 'member', memberStatus: data.memberStatus === 'inactive' ? 'inactive' : 'active' }
}

const activityFromSnapshot = (snapshot: QueryDocumentSnapshot<DocumentData>): Activity => {
  const data = snapshot.data()
  const type = typeof data.type === 'string' ? data.type : 'system'
  const participantName = typeof data.participantName === 'string' ? data.participantName : 'Deelnemer'
  const month = typeof data.monthLabel === 'string' ? data.monthLabel : ''
  if (type === 'user_registered') return { id: snapshot.id, icon: 'users', title: `${participantName} geregistreerd`, detail: 'Automatisch toegevoegd aan de groep.', time: 'Recent', tone: 'success' }
  if (type === 'month_assigned') return { id: snapshot.id, icon: 'person', title: `${participantName} draaide het rad`, detail: `${month} is toegewezen en vergrendeld.`, time: 'Recent', tone: 'success' }
  if (type === 'month_reassigned') return { id: snapshot.id, icon: 'lock', title: `${month} opnieuw toegewezen`, detail: `${participantName} heeft deze maand van de administrator ontvangen.`, time: 'Recent', tone: 'success' }
  if (type === 'month_unlocked') return { id: snapshot.id, icon: 'lock', title: `${month} ontgrendeld`, detail: 'De maand is opnieuw beschikbaar gemaakt.', time: 'Recent', tone: 'success' }
  if (type === 'wheel_reset') return { id: snapshot.id, icon: 'lock', title: 'Maandrad gereset', detail: 'Alle toegewezen maanden zijn ontgrendeld.', time: 'Recent', tone: 'success' }
  if (type === 'settings_updated') return { id: snapshot.id, icon: 'info', title: 'Instellingen gewijzigd', detail: `Automatische meldingen zijn ${data.notificationsEnabled === true ? 'ingeschakeld' : 'uitgeschakeld'}.`, time: 'Recent', tone: 'success' }
  if (type === 'invitation_created') return { id: snapshot.id, icon: 'users', title: 'Uitnodiging gemaakt', detail: 'Een eenmalige toegangscode is aangemaakt.', time: 'Recent', tone: 'success' }
  if (type === 'phone_updated') return { id: snapshot.id, icon: 'person', title: `${participantName} wijzigde het profiel`, detail: 'Het mobiele nummer is veilig bijgewerkt.', time: 'Recent', tone: 'success' }
  if (type === 'reminder_queued') return { id: snapshot.id, icon: 'info', title: `Herinnering voorbereid voor ${participantName}`, detail: `${month} staat klaar in de beveiligde outbox; er is nog geen berichtenprovider gekoppeld.`, time: 'Recent', tone: 'success' }
  if (type === 'messaging_consent_updated') return { id: snapshot.id, icon: 'info', title: `${participantName} wijzigde meldingsvoorkeuren`, detail: `WhatsApp-herinneringen zijn ${data.whatsappOptIn === true ? 'toegestaan' : 'uitgeschakeld'}.`, time: 'Recent', tone: 'success' }
  if (type === 'participant_access_updated') return { id: snapshot.id, icon: 'lock', title: `Toegang van ${participantName} gewijzigd`, detail: `Rol: ${String(data.role)} · status: ${String(data.status)}.`, time: 'Recent', tone: 'success' }
  if (type === 'group_created') return { id: snapshot.id, icon: 'users', title: 'Kasgeldgroep aangemaakt', detail: 'De nieuwe groep is klaar voor uitnodigingen.', time: 'Recent', tone: 'success' }
  if (type === 'user_joined_group') return { id: snapshot.id, icon: 'users', title: `${participantName} trad toe`, detail: 'De uitnodiging is veilig geconsumeerd.', time: 'Recent', tone: 'success' }
  return { id: snapshot.id, icon: 'info', title: 'Systeemactiviteit', detail: 'De groepsgegevens zijn gewijzigd.', time: 'Recent' }
}

export async function provisionCurrentUser(inviteCode = ''): Promise<ProvisionResult> {
  const callable = httpsCallable<{ inviteCode: string }, ProvisionResult>(requireFunctions(), 'provisionUser')
  return (await callable({ inviteCode })).data
}

export function subscribeToGroup(groupId: string, handlers: RealtimeHandlers): Unsubscribe {
  const db = requireDb()
  const unsubscribers = [
    onSnapshot(collection(db, 'groups', groupId, 'participants'), snapshot => handlers.onParticipants(snapshot.docs.map(participantFromSnapshot)), error => handlers.onError(error)),
    onSnapshot(query(collection(db, 'groups', groupId, 'activities'), orderBy('createdAt', 'desc'), limit(20)), snapshot => handlers.onActivities(snapshot.docs.map(activityFromSnapshot)), error => handlers.onError(error)),
    onSnapshot(doc(db, 'groups', groupId), snapshot => { if (snapshot.exists()) { const data = snapshot.data(); handlers.onNotificationsEnabled(data.notificationsEnabled === true); handlers.onCycleSettings?.({ cycleYear: Number(data.cycleYear) || new Date().getFullYear(), monthlyContributionCents: Number(data.monthlyContributionCents) || 10000, payoutDay: Number(data.payoutDay) || 6 }) } }, error => handlers.onError(error)),
    onSnapshot(collection(db, 'groups', groupId, 'months'), snapshot => handlers.onPayoutStatuses?.(Object.fromEntries(snapshot.docs.map(document => [document.id, { adminPaid: Boolean(document.get('adminPaidAt')), recipientConfirmed: Boolean(document.get('recipientConfirmedAt')), participantId: String(document.get('participantId') || '') }]))), error => handlers.onError(error)),
  ]
  return () => unsubscribers.forEach(unsubscribe => unsubscribe())
}
