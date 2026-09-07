import { useEffect, useState, type CSSProperties } from 'react'
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
  dealIndex?: number
  doubled?: boolean
  peeking?: boolean
}

export function CardView({
  card,
  faceDown = false,
  dealIndex = 0,
  doubled = false,
  peeking = false,
}: Props) {
  const [landed, setLanded] = useState(false)
  const [showBack, setShowBack] = useState(faceDown || !card)
  const [flipping, setFlipping] = useState(false)
  const red = card?.suit === 'hearts' || card?.suit === 'diamonds'
  const label = !card
    ? 'Face-down card'
    : showBack
      ? 'Face-down card'
      : `${card.rank} of ${card.suit}`

  useEffect(() => {
    if (faceDown || !card) {
      setShowBack(true)
      setFlipping(false)
      return
    }
    if (!showBack) return
    setFlipping(true)
    const mid = window.setTimeout(() => setShowBack(false), 220)
    const done = window.setTimeout(() => setFlipping(false), 480)
    return () => {
      window.clearTimeout(mid)
      window.clearTimeout(done)
    }
  }, [faceDown, card, showBack])

  return (
    <div
      className={`card-slot ${landed ? 'is-landed' : ''} ${peeking ? 'is-peeking' : ''}`}
      style={{ '--deal-i': dealIndex } as CSSProperties}
      aria-label={label}
      role="img"
      onAnimationEnd={(e) => {
        if (e.animationName === 'deal-from-shoe' && e.target === e.currentTarget) {
          setLanded(true)
        }
      }}
    >
      <div
        className={`card-orient ${doubled ? 'is-doubled' : ''} ${flipping ? 'is-flipping' : ''}`}
      >
        {showBack || !card ? (
          <div className="card-face card-back" />
        ) : (
          <div className={`card-face card-front ${red ? 'red' : ''}`}>
            <CardFace card={card} />
          </div>
        )}
      </div>
    </div>
  )
}

function CardFace({ card }: { card: CardType }) {
  const suit = SUIT_SYM[card.suit]
  const face = card.rank === 'J' || card.rank === 'Q' || card.rank === 'K'
  return (
    <>
      <span className="corner tl">
        <b>{card.rank}</b>
        <i>{suit}</i>
      </span>
      <span className={`pip-center ${face ? 'is-face' : ''}`}>
        {face ? (
          <>
            <em>{card.rank}</em>
            <i>{suit}</i>
          </>
        ) : (
          suit
        )}
      </span>
      <span className="corner br">
        <b>{card.rank}</b>
        <i>{suit}</i>
      </span>
    </>
  )
}
