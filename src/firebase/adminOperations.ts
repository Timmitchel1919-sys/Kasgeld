import { httpsCallable } from 'firebase/functions'
import { requireFunctions } from './client'

async function adminOperation(name: 'revokeInvitation' | 'retryNotification' | 'cancelNotification', groupId: string, resource: Record<string, string>) {
  return (await httpsCallable<Record<string, string>, { status: string }>(requireFunctions(), name)({ groupId, ...resource })).data
}

export const revokeInvitation = (groupId: string, invitationId: string) => adminOperation('revokeInvitation', groupId, { invitationId })
export const retryNotification = (groupId: string, messageId: string) => adminOperation('retryNotification', groupId, { messageId })
export const cancelNotification = (groupId: string, messageId: string) => adminOperation('cancelNotification', groupId, { messageId })
