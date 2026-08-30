import { handTotal } from '../engine/hand'
import type { DealerHand, PlayerHand } from '../engine/types'
import { CardView } from './CardView'

type DealerProps = {
  dealer: DealerHand
}

export function DealerZone({ dealer }: DealerProps) {
  const visible = dealer.holeHidden
    ? dealer.cards.slice(0, 1)
    : dealer.cards
  const total = dealer.holeHidden
    ? null
    : handTotal(dealer.cards).total

  return (
    <div className="hand-zone dealer">
      <div className="zone-label">Dealer</div>
      <div className="cards-row">
        {dealer.cards.map((c, i) => (
          <CardView
            key={c.id}
            card={c}
            faceDown={dealer.holeHidden && i === 1}
          />
        ))}
        {visible.length === 0 && <div className="cards-row" />}
      </div>
      {total !== null && <div className="total-badge">{total}</div>}
    </div>
  )
}

type PlayerProps = {
  hands: PlayerHand[]
  activeIndex: number
}

export function PlayerZone({ hands, activeIndex }: PlayerProps) {
  return (
    <div className="hand-zone player">
      <div className="zone-label">Player</div>
      <div className="player-hands">
        {hands.map((h, i) => {
          const t = handTotal(h.cards)
          return (
            <div
              key={i}
              className={`player-hand ${i === activeIndex ? 'active' : ''}`}
            >
              <div className="cards-row">
                {h.cards.map((c) => (
                  <CardView key={c.id} card={c} />
                ))}
              </div>
              <div className="total-badge">
                {t.busted ? 'BUST' : t.soft ? `${t.total} soft` : t.total}
                {h.surrendered ? ' · SUR' : ''}
                {` · $${h.bet}`}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
