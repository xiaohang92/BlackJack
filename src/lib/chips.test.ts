import { describe, expect, it } from 'vitest'
import { breakdownChips, chipTone } from './chips'

describe('chips', () => {
  it('breaks a bet into casino denominations', () => {
    expect(breakdownChips(131)).toEqual([100, 25, 5, 1])
  })

  it('caps visual chips', () => {
    expect(breakdownChips(4000, 4)).toEqual([500, 500, 500, 500])
  })

  it('maps chip colors', () => {
    expect(chipTone(1)).toBe('white')
    expect(chipTone(5)).toBe('red')
    expect(chipTone(25)).toBe('green')
    expect(chipTone(100)).toBe('black')
    expect(chipTone(500)).toBe('purple')
  })
})
