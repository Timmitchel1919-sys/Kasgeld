import { describe, expect, it } from 'vitest'
import { monthIdByLabel, parseGroupId, parseMonthId, parseNotificationsEnabled, parseParticipantId } from './adminDomain.js'

describe('admin domain validation', () => {
  it('accepteert uitsluitend begrensde document- en maand-ID\'s', () => {
    expect(parseGroupId('kasgeld-main')).toBe('kasgeld-main')
    expect(parseParticipantId('user_123')).toBe('user_123')
    expect(parseMonthId('april')).toBe('april')
    expect(() => parseGroupId('../groep')).toThrow()
    expect(() => parseParticipantId('user/123')).toThrow()
    expect(() => parseMonthId('smarch')).toThrow()
  })

  it('valideert instellingen en vertaalt maandlabels', () => {
    expect(parseNotificationsEnabled(false)).toBe(false)
    expect(() => parseNotificationsEnabled('false')).toThrow()
    expect(monthIdByLabel('April')).toBe('april')
    expect(monthIdByLabel(null)).toBeNull()
  })
})
