import { describe, expect, it } from 'vitest'
import { dealerDealIndex, playerDealIndex } from './dealIndex'

describe('deal indices', () => {
  it('staggers the opening four cards', () => {
    expect([
      playerDealIndex(0),
      dealerDealIndex(0),
      playerDealIndex(1),
      dealerDealIndex(1),
    ]).toEqual([0, 1, 2, 3])
  })

  it('never shares a delay across player and dealer cards', () => {
    const player = Array.from({ length: 8 }, (_, i) => playerDealIndex(i))
    const dealer = Array.from({ length: 8 }, (_, i) => dealerDealIndex(i))
    expect(player.filter((n) => dealer.includes(n))).toEqual([])
  })
})
