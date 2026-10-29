import { describe, expect, it } from 'vitest'
import { createInviteCode, hashInviteCode, normalizeInviteCode, normalizePhone, reminderMonthForDate } from './membershipDomain.js'

describe('membership and reminder domain', () => {
  it('maakt sterke genormaliseerde uitnodigingscodes zonder de ruwe code als document-ID te gebruiken', () => {
    const code = createInviteCode()
    expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)
    expect(normalizeInviteCode(code)).toHaveLength(12)
    expect(hashInviteCode(code)).toMatch(/^[a-f0-9]{64}$/)
  })

  it('accepteert alleen internationale telefoonnummers', () => {
    expect(normalizePhone('+597 812-3456')).toBe('+5978123456')
    expect(() => normalizePhone('8123456')).toThrow('invalid-phone')
  })

  it('plant alleen op de zesde voor de vorige kalendermaand', () => {
    expect(reminderMonthForDate(new Date('2026-05-06T12:00:00Z'))).toBe('April')
    expect(reminderMonthForDate(new Date('2026-05-07T12:00:00Z'))).toBeNull()
  })
})
