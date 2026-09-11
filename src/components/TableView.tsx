import { handTotal, isBlackjack } from '../engine/hand'
import { cardsRemaining, totalCards } from '../engine/shoe'
import type {
  DealerHand,
  GamePhase,
  HandPayout,
  PlayerHand,
  RulesConfig,
} from '../engine/types'
import type { GameState } from '../engine/gameMachine'
import { CardView } from './CardView'
import { ChipStack } from './ChipStack'
import { ShoeView } from './ShoeView'
import { dealerDealIndex, playerDealIndex } from './dealIndex'

type FeltProps = {
  game: GameState
  rules: RulesConfig
  betInput: number
  peeking: boolean
  shuffling: boolean
  loud?: boolean
}

export function FeltTable({
  game,
  rules,
  betInput,
  peeking,
  shuffling,
  loud = false,
}: FeltProps) {
  const phase = game.phase.kind
  const showSpotBet = phase === 'betting' || game.playerHands.length === 0
  const payoutFor = (i: number) => game.lastPayouts.find((p) => p.handIndex === i)

  return (
    <div className={`felt${loud ? ' is-play' : ''}`} data-tour="felt">
      <div className="felt-rail" />

      <div className="felt-top">
        <DealerZone dealer={game.dealer} peeking={peeking} phase={phase} />
        <ShoeView
          remaining={cardsRemaining(game.shoe)}
          total={totalCards(game.shoe)}
        />
      </div>

      <div className="felt-spot">
        <div className="felt-markings">
          <p className="felt-bj">
            BLACKJACK PAYS {rules.blackjackPayout === '3:2' ? '3 TO 2' : '6 TO 5'}
          </p>
          <p className="felt-ins">INSURANCE PAYS 2 TO 1</p>
          <p className="felt-s17">
            {rules.hitSoft17 ? 'DEALER HITS SOFT 17' : 'DEALER MUST STAND ON 17'}
          </p>
        </div>

        {showSpotBet && (
          <div className="bet-circle-wrap">
            <div className="bet-circle">
              {betInput > 0 ? (
                <ChipStack amount={betInput} />
              ) : (
                <span className="bet-circle-caption">BET</span>
              )}
            </div>
          </div>
        )}

        {phase === 'handComplete' && game.lastPayouts[0] && (
          <ResultRibbon
            payout={payoutFor(game.activeHandIndex) ?? game.lastPayouts[0]}
            loud={loud}
          />
        )}
      </div>

      {game.playerHands.length > 0 && (
        <PlayerZone
          hands={game.playerHands}
          activeIndex={game.activeHandIndex}
          payouts={game.lastPayouts}
          showResults={phase === 'handComplete' || phase === 'payout'}
        />
      )}

      {shuffling && (
        <div className="shuffle-overlay" role="status">
          <div className="shuffle-cards" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <strong>Shuffling shoe</strong>
        </div>
      )}
    </div>
  )
}

type DealerProps = {
  dealer: DealerHand
  peeking: boolean
  phase: GamePhase['kind']
}

function DealerZone({ dealer, peeking, phase }: DealerProps) {
  const total = dealer.holeHidden ? null : handTotal(dealer.cards).total
  const bj = !dealer.holeHidden && isBlackjack(dealer.cards)

  return (
    <div className="hand-zone dealer">
      <div className="zone-label">Dealer</div>
      <div className="cards-row">
        {dealer.cards.map((c, i) => (
          <CardView
            key={c.id}
            card={c}
            faceDown={dealer.holeHidden && i === 1}
            dealIndex={dealerDealIndex(i)}
            peeking={peeking && i === 1 && dealer.holeHidden}
          />
        ))}
      </div>
      {total !== null && (
        <div className={`total-badge ${bj ? 'is-bj' : ''}`}>
          {bj ? 'BLACKJACK' : total}
        </div>
      )}
      {dealer.holeHidden && dealer.cards.length > 0 && phase !== 'betting' && (
        <div className="total-badge is-hidden">
          {handTotal(dealer.cards.slice(0, 1)).total} + ?
        </div>
      )}
    </div>
  )
}

type PlayerProps = {
  hands: PlayerHand[]
  activeIndex: number
  payouts: HandPayout[]
  showResults: boolean
}

function PlayerZone({ hands, activeIndex, payouts, showResults }: PlayerProps) {
  return (
    <div className="hand-zone player">
      <div className="zone-label">You</div>
      <div className="player-hands">
        {hands.map((h, i) => {
          const t = handTotal(h.cards)
          const payout = payouts.find((p) => p.handIndex === i)
          const bj = isBlackjack(h.cards) && !h.fromSplit && hands.length === 1
          return (
            <div
              key={i}
              className={`player-hand ${i === activeIndex ? 'active' : ''} ${
                t.busted ? 'is-bust' : ''
              } ${showResults && payout ? `is-${payout.result}` : ''}`}
            >
              <div className="cards-row">
                {h.cards.map((c, ci) => (
                  <CardView
                    key={c.id}
                    card={c}
                    dealIndex={playerDealIndex(ci)}
                    doubled={h.doubled && ci === h.cards.length - 1}
                  />
                ))}
              </div>
              <ChipStack amount={h.bet} />
              <div className={`total-badge ${t.busted ? 'is-bust' : ''} ${bj ? 'is-bj' : ''}`}>
                {t.busted
                  ? 'BUST'
                  : bj
                    ? 'BLACKJACK'
                    : t.soft
                      ? `${t.total} soft`
                      : t.total}
                {h.surrendered ? ' · SUR' : ''}
              </div>
              {showResults && payout && (
                <div className={`result-tag ${payout.result}`}>
                  {resultLabel(payout.result, payout.net)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ResultRibbon({
  payout,
  loud = false,
}: {
  payout: HandPayout
  loud?: boolean
}) {
  return (
    <div
      className={`result-ribbon ${payout.result}${loud ? ' is-loud' : ''}`}
      role="status"
    >
      {resultLabel(payout.result, payout.net)}
    </div>
  )
}

function resultLabel(
  result: HandPayout['result'],
  net: number,
): string {
  const money =
    net > 0 ? `+$${net.toFixed(0)}` : net < 0 ? `-$${Math.abs(net).toFixed(0)}` : '$0'
  switch (result) {
    case 'blackjack':
      return `Blackjack ${money}`
    case 'win':
      return `You win ${money}`
    case 'loss':
      return `Dealer wins ${money}`
    case 'push':
      return 'Push'
    case 'surrender':
      return `Surrender ${money}`
  }
}

export { DealerZone, PlayerZone }
