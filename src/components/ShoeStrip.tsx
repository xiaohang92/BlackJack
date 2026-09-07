type Props = {
  round: number
  decks: number
  cardsLeft: number
  cardsTotal: number
  decksRemaining: number
  shuffleNext: boolean
}

export function ShoeStrip({
  round,
  decks,
  cardsLeft,
  cardsTotal,
  decksRemaining,
  shuffleNext,
}: Props) {
  const used = Math.max(0, cardsTotal - cardsLeft)
  const pct = cardsTotal > 0 ? (used / cardsTotal) * 100 : 0

  return (
    <div className="shoe-strip" data-tour="shoe">
      <span className="shoe-round">
        {shuffleNext ? 'Shuffle next' : `Round ${round}`}
      </span>
      <span className="shoe-meta">{decks}D</span>
      <div
        className="shoe-meter"
        title={`${cardsLeft} of ${cardsTotal} cards left`}
      >
        <div className="fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="shoe-left">
        {cardsLeft}/{cardsTotal} · {decksRemaining.toFixed(1)} left
      </span>
    </div>
  )
}
