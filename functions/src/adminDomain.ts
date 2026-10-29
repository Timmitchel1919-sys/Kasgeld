import { MONTHS } from './domain.js'

const documentIdPattern = /^[A-Za-z0-9_-]{1,128}$/

export function parseGroupId(value: unknown): string {
  if (typeof value !== 'string' || !documentIdPattern.test(value)) throw new Error('invalid-group-id')
  return value
}

export function parseMonthId(value: unknown): string {
  if (typeof value !== 'string' || !MONTHS.some(month => month.id === value)) throw new Error('invalid-month-id')
  return value
}

export function parseParticipantId(value: unknown): string {
  if (typeof value !== 'string' || !documentIdPattern.test(value)) throw new Error('invalid-participant-id')
  return value
}

export function parseNotificationsEnabled(value: unknown): boolean {
  if (typeof value !== 'boolean') throw new Error('invalid-notifications-setting')
  return value
}

export function monthById(monthId: string) {
  const month = MONTHS.find(candidate => candidate.id === monthId)
  if (!month) throw new Error('invalid-month-id')
  return month
}

export function monthIdByLabel(label: unknown): string | null {
  if (typeof label !== 'string') return null
  return MONTHS.find(month => month.label === label)?.id ?? null
}
