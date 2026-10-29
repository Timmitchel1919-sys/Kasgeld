import { describe, expect, it } from 'vitest'
import { parseCycleSettings, parsePayoutAction } from './cycleDomain.js'

describe('cycle domain', () => {
  it('accepteert alleen begrensde ronde-instellingen', () => {
    expect(parseCycleSettings({ cycleYear: 2027, monthlyContributionCents: 12500, payoutDay: 6 })).toEqual({ cycleYear: 2027, monthlyContributionCents: 12500, payoutDay: 6 })
    expect(() => parseCycleSettings({ cycleYear: 2027, monthlyContributionCents: 0, payoutDay: 6 })).toThrow()
    expect(() => parseCycleSettings({ cycleYear: 2027, monthlyContributionCents: 12500, payoutDay: 31 })).toThrow()
  })

  it('weigert onbekende uitbetalingsacties', () => {
    expect(parsePayoutAction('mark_paid')).toBe('mark_paid')
    expect(parsePayoutAction('confirm_received')).toBe('confirm_received')
    expect(() => parsePayoutAction('paid')).toThrow()
  })
})
