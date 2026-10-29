import { describe, expect, it } from 'vitest'
import { chooseMonth, hasActiveSpinLock, MONTHS, parseSpinInput } from './domain.js'

describe('spinMonth domain', () => {
  it('accepteert een begrensde geldige aanvraag', () => {
    expect(parseSpinInput({ groupId: 'group_1', participantId: 'participant-1', idempotencyKey: 'request_1234567890' })).toEqual({
      groupId: 'group_1', participantId: 'participant-1', idempotencyKey: 'request_1234567890',
    })
  })

  it.each([
    null,
    {},
    { groupId: '../group', participantId: 'p1', idempotencyKey: 'request_1234567890' },
    { groupId: 'g1', participantId: 'p/1', idempotencyKey: 'request_1234567890' },
    { groupId: 'g1', participantId: 'p1', idempotencyKey: 'short' },
  ])('weigert ongeldige invoer %#', value => expect(() => parseSpinInput(value)).toThrow())

  it('selecteert uitsluitend uit beschikbare maanden', () => {
    const available = MONTHS.filter(month => ['mei', 'juni'].includes(month.id))
    expect(chooseMonth(available, () => 1).id).toBe('juni')
  })

  it('weigert een lege maandpool en een ongeldige random index', () => {
    expect(() => chooseMonth([])).toThrow('no-months-available')
    expect(() => chooseMonth(MONTHS, () => MONTHS.length)).toThrow('invalid-random-index')
  })

  it('blokkeert een tweede spin zolang de groepslease actief is', () => {
    expect(hasActiveSpinLock(4_000, 3_999)).toBe(true)
    expect(hasActiveSpinLock(4_000, 4_000)).toBe(false)
    expect(hasActiveSpinLock(undefined, 4_000)).toBe(false)
  })
})
