import { describe, expect, it } from 'vitest'
import { roleForEmail, safeDisplayName } from './provisionUser.js'

describe('provisionUser domain', () => {
  it('kent alleen het vaste e-mailadres de ownerrol toe', () => {
    expect(roleForEmail('SHEQ97@gmail.com')).toBe('owner')
    expect(roleForEmail('member@example.com')).toBe('member')
  })

  it('normaliseert een bruikbare weergavenaam', () => {
    expect(safeDisplayName('  Shaquil  ', 'sheq97@gmail.com')).toBe('Shaquil')
    expect(safeDisplayName('', 'member@example.com')).toBe('member')
  })
})
