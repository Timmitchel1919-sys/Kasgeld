import { httpsCallable } from 'firebase/functions'
import { requireFunctions } from './client'

export type SpinMonthResult = {
  groupId: string
  participantId: string
  monthId: string
  monthLabel: string
  idempotencyKey: string
  replayed: boolean
}

export function createSpinIdempotencyKey(): string {
  return `spin_${crypto.randomUUID().replaceAll('-', '')}`
}

export async function spinMonthAssignment(groupId: string, participantId: string, idempotencyKey: string) {
  const callable = httpsCallable<
    { groupId: string; participantId: string; idempotencyKey: string },
    SpinMonthResult
  >(requireFunctions(), 'spinMonthV2')
  const response = await callable({ groupId, participantId, idempotencyKey })
  return response.data
}
