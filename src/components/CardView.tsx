import type { Card as CardType } from '../engine/types'

const SUIT_SYM: Record<CardType['suit'], string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
}

type Props = {
  card?: CardType
  faceDown?: boolean
}

export function CardView({ card, faceDown }: Props) {
  if (faceDown || !card) {
    return <div className="card back" aria-label="Face-down card" />
  }
  const red = card.suit === 'hearts' || card.suit === 'diamonds'
  return (
    <div
      className={`card ${red ? 'red' : ''}`}
      aria-label={`${card.rank} of ${card.suit}`}
    >
      <span>{card.rank}</span>
      <span className="suit">{SUIT_SYM[card.suit]}</span>
      <span className="rank-br">{card.rank}</span>
    </div>
  )
}
