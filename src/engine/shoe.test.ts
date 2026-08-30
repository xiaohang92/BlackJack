import { describe, expect, it } from 'vitest'
import {
  cardsRemaining,
  createShoe,
  dealCard,
  reshuffleShoe,
} from './shoe'

describe('shoe', () => {
  it('creates multi-deck shoe with cut card', () => {
    const shoe = createShoe(6, 0.75, () => 0.5)
    expect(shoe.cards.length).toBe(312)
    expect(shoe.cutIndex).toBe(Math.floor(312 * 0.75))
  })

  it('marks needsShuffle at penetration', () => {
    let shoe = createShoe(1, 0.5, () => 0.1)
    const target = shoe.cutIndex
    for (let i = 0; i < target; i++) {
      ;({ shoe } = dealCard(shoe))
    }
    expect(shoe.needsShuffle).toBe(true)
    expect(cardsRemaining(shoe)).toBe(52 - target)
  })

  it('reshuffles and resets discards', () => {
    let shoe = createShoe(2, 0.75, () => 0.2)
    ;({ shoe } = dealCard(shoe))
    ;({ shoe } = dealCard(shoe))
    shoe = reshuffleShoe(shoe, () => 0.3)
    expect(shoe.discards.length).toBe(0)
    expect(shoe.cards.length).toBe(104)
    expect(shoe.needsShuffle).toBe(false)
  })
})
