import { randomInt } from 'node:crypto'

export const MONTHS = [
  { id: 'januari', label: 'Januari' },
  { id: 'februari', label: 'Februari' },
  { id: 'maart', label: 'Maart' },
  { id: 'april', label: 'April' },
  { id: 'mei', label: 'Mei' },
  { id: 'juni', label: 'Juni' },
  { id: 'juli', label: 'Juli' },
  { id: 'augustus', label: 'Augustus' },
  { id: 'september', label: 'September' },
  { id: 'oktober', label: 'Oktober' },
  { id: 'november', label: 'November' },
  { id: 'december', label: 'December' },
] as const

const documentIdPattern = /^[A-Za-z0-9_-]{1,128}$/
const idempotencyPattern = /^[A-Za-z0-9_-]{16,128}$/

export type SpinInput = {
  groupId: string
  participantId: string
  idempotencyKey: string
}

export function parseSpinInput(value: unknown): SpinInput {
  if (!value || typeof value !== 'object') throw new Error('invalid-argument')
  const input = value as Record<string, unknown>
  if (typeof input.groupId !== 'string' || !documentIdPattern.test(input.groupId)) throw new Error('invalid-group-id')
  if (typeof input.participantId !== 'string' || !documentIdPattern.test(input.participantId)) throw new Error('invalid-participant-id')
  if (typeof input.idempotencyKey !== 'string' || !idempotencyPattern.test(input.idempotencyKey)) throw new Error('invalid-idempotency-key')
  return { groupId: input.groupId, participantId: input.participantId, idempotencyKey: input.idempotencyKey }
}

export function chooseMonth<T>(available: readonly T[], chooser: (max: number) => number = randomInt): T {
  if (available.length === 0) throw new Error('no-months-available')
  const index = chooser(available.length)
  if (!Number.isInteger(index) || index < 0 || index >= available.length) throw new Error('invalid-random-index')
  return available[index] as T
}

export function hasActiveSpinLock(lockUntilMillis: number | null | undefined, nowMillis: number): boolean {
  return Number.isFinite(lockUntilMillis) && Number(lockUntilMillis) > nowMillis
}
