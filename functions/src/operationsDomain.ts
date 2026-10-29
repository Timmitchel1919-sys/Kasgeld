const resourceIdPattern = /^[A-Za-z0-9_-]{8,128}$/
const invitationIdPattern = /^[a-f0-9]{64}$/

export function parseInvitationId(value: unknown): string {
  if (typeof value !== 'string' || !invitationIdPattern.test(value)) throw new Error('invalid-invitation-id')
  return value
}

export function parseOutboxId(value: unknown): string {
  if (typeof value !== 'string' || !resourceIdPattern.test(value)) throw new Error('invalid-outbox-id')
  return value
}

export const canRetryNotification = (status: unknown) => ['failed', 'failed_no_channel', 'pending_provider'].includes(String(status))
export const canCancelNotification = (status: unknown) => ['queued', 'pending_provider', 'failed', 'failed_no_channel'].includes(String(status))
