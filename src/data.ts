import type { Activity, Participant } from './types'

export const months = [
  'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December',
]

export const initialParticipants: Participant[] = [
  { id: 1, name: 'Shaquil', phone: '+31 6 12345678', initials: 'S', color: '#8d4d21', assignedMonth: 'April' },
  { id: 2, name: 'Aisha', phone: '+31 6 87654321', initials: 'A', color: '#913f66' },
  { id: 3, name: 'Daan', phone: '+31 6 11223344', initials: 'D', color: '#397889' },
  { id: 4, name: 'Fatima', phone: '+31 6 99887766', initials: 'F', color: '#4a506e' },
  { id: 5, name: 'Rachid', phone: '+31 6 44556677', initials: 'R', color: '#463b33' },
]

export const initialActivities: Activity[] = [
  { id: 1, icon: 'person', title: 'Shaquil draaide het rad', detail: 'April geregistreerd', time: 'Vandaag 14:26', tone: 'success' },
  { id: 2, icon: 'lock', title: 'April toegewezen aan Shaquil', detail: 'Andere deelnemers kunnen april niet meer kiezen.', time: 'Vandaag 14:26' },
  { id: 3, icon: 'users', title: 'Maandrad gedraaid', detail: '1 van 12 maanden toegewezen.', time: 'Vandaag 14:26' },
  { id: 4, icon: 'info', title: 'Systeem', detail: 'Automatische meldingen staan aan.', time: 'Vandaag 13:10' },
]
