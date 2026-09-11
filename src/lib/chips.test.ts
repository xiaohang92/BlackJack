import { describe, expect, it } from 'vitest'
import { breakdownChips, chipTone, groupChips } from './chips'

describe('chips', () => {
  it('breaks a bet into casino denominations', () => {
    expect(breakdownChips(131)).toEqual([100, 25, 5, 1])
  })

  it('caps visual chips', () => {
    expect(breakdownChips(4000, 4)).toEqual([500, 500, 500, 500])
  })

  it('racks mixed bets into same-color columns', () => {
    expect(groupChips(631)).toEqual([
      { value: 500, count: 1 },
      { value: 100, count: 1 },
      { value: 25, count: 1 },
      { value: 5, count: 1 },
      { value: 1, count: 1 },
    ])
    expect(groupChips(10)).toEqual([{ value: 5, count: 2 }])
  })

  it('caps how tall a denomination pile can get', () => {
    expect(groupChips(4000, 4)).toEqual([{ value: 500, count: 4 }])
  })

  it('maps chip colors', () => {
    expect(chipTone(1)).toBe('white')
    expect(chipTone(5)).toBe('red')
    expect(chipTone(25)).toBe('green')
    expect(chipTone(100)).toBe('black')
    expect(chipTone(500)).toBe('purple')
  })
})
