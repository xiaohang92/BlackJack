import type { Card, Rank, Suit } from './types'

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']
const RANKS: Rank[] = [
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
]

export type Shoe = {
  cards: Card[]
  discards: Card[]
  decks: number
  penetration: number
  cutIndex: number
  needsShuffle: boolean
  nextId: number
}

function buildDeck(startId: number): { cards: Card[]; nextId: number } {
  const cards: Card[] = []
  let id = startId
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      cards.push({ suit, rank, id: `c${id++}` })
    }
  }
  return { cards, nextId: id }
}

/** Fisher–Yates shuffle (mutates copy). */
export function shuffleCards(cards: Card[], rng: () => number = Math.random): Card[] {
  const out = [...cards]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

export function createShoe(
  decks: number,
  penetration: number,
  rng: () => number = Math.random,
): Shoe {
  let all: Card[] = []
  let nextId = 0
  for (let d = 0; d < decks; d++) {
    const built = buildDeck(nextId)
    all = all.concat(built.cards)
    nextId = built.nextId
  }
  const cards = shuffleCards(all, rng)
  const cutIndex = Math.floor(cards.length * penetration)
  return {
    cards,
    discards: [],
    decks,
    penetration,
    cutIndex,
    needsShuffle: false,
    nextId,
  }
}

export function cardsRemaining(shoe: Shoe): number {
  return shoe.cards.length
}

export function cardsDealt(shoe: Shoe): number {
  return shoe.discards.length
}

export function totalCards(shoe: Shoe): number {
  return shoe.decks * 52
}

export function dealCard(shoe: Shoe): { shoe: Shoe; card: Card } {
  if (shoe.cards.length === 0) {
    throw new Error('Shoe is empty')
  }
  const card = shoe.cards[0]!
  const remaining = shoe.cards.slice(1)
  const dealtCount = shoe.discards.length + 1
  const needsShuffle = dealtCount >= shoe.cutIndex || remaining.length === 0
  return {
    card,
    shoe: {
      ...shoe,
      cards: remaining,
      discards: [...shoe.discards, card],
      needsShuffle,
    },
  }
}

export function reshuffleShoe(shoe: Shoe, rng: () => number = Math.random): Shoe {
  const all = [...shoe.cards, ...shoe.discards]
  const cards = shuffleCards(all, rng)
  return {
    ...shoe,
    cards,
    discards: [],
    cutIndex: Math.floor(cards.length * shoe.penetration),
    needsShuffle: false,
  }
}
