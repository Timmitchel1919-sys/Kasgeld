import { httpsCallable } from 'firebase/functions'
import { requireFunctions } from './client'

export type CycleSettings = { cycleYear: number; monthlyContributionCents: number; payoutDay: number }
export type GroupExport = Record<string, unknown>

export async function saveCycleSettings(groupId: string, settings: CycleSettings) {
  return (await httpsCallable<{ groupId: string } & CycleSettings, CycleSettings>(requireFunctions(), 'updateCycleSettings')({ groupId, ...settings })).data
}

export async function confirmPayout(groupId: string, monthId: string, action: 'mark_paid' | 'confirm_received') {
  return (await httpsCallable<{ groupId: string; monthId: string; action: string }, unknown>(requireFunctions(), 'confirmPayout')({ groupId, monthId, action })).data
}

export async function transferOwnership(groupId: string, participantId: string) {
  return (await httpsCallable<{ groupId: string; participantId: string }, unknown>(requireFunctions(), 'transferGroupOwnership')({ groupId, participantId })).data
}

export async function downloadGroupExport(groupId: string) {
  const data = (await httpsCallable<{ groupId: string }, GroupExport>(requireFunctions(), 'exportGroupData')({ groupId })).data
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `kasgeld-${groupId}-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}
