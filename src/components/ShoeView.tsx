type Props = {
  remaining: number
  total: number
}

export function ShoeView({ remaining, total }: Props) {
  const ratio = total > 0 ? remaining / total : 1
  const decks = remaining / 52
  return (
    <div
      className="shoe"
      title={`${remaining} cards left`}
      aria-label={`Shoe, ${decks.toFixed(1)} decks remaining`}
    >
      <div className="shoe-body">
        <div className="shoe-cards" style={{ height: `${Math.max(8, ratio * 100)}%` }} />
      </div>
      <div className="shoe-label">{decks.toFixed(1)} decks</div>
    </div>
  )
}
