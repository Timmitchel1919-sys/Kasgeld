import { httpsCallable } from 'firebase/functions'
import { requireFunctions } from './client'

export async function createInvitation(groupId: string) {
  return (await httpsCallable<{ groupId: string }, { groupId: string; code: string; expiresInDays: number }>(requireFunctions(), 'createInvitation')({ groupId })).data
}

export async function updateOwnPhone(groupId: string, phone: string) {
  return (await httpsCallable<{ groupId: string; phone: string }, { groupId: string; phone: string }>(requireFunctions(), 'updateOwnPhone')({ groupId, phone })).data
}
