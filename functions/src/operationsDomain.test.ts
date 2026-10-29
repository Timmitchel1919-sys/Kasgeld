import { describe, expect, it } from 'vitest'
import { canCancelNotification, canRetryNotification, parseInvitationId, parseOutboxId } from './operationsDomain.js'

describe('admin operations domain', () => {
  it('begrensd uitnodigings- en outbox-ID’s', () => {
    expect(parseInvitationId('a'.repeat(64))).toHaveLength(64)
    expect(parseOutboxId('message_123')).toBe('message_123')
    expect(() => parseInvitationId('../invite')).toThrow()
    expect(() => parseOutboxId('x/../../y')).toThrow()
  })

  it('staat alleen herstelbare berichtstatussen toe', () => {
    expect(canRetryNotification('failed')).toBe(true)
    expect(canRetryNotification('sent')).toBe(false)
    expect(canCancelNotification('queued')).toBe(true)
    expect(canCancelNotification('sent')).toBe(false)
  })
})
