type Props = {
  bet: number
  bankroll: number
  recommended: number
  onBetChange: (n: number) => void
  onDeal: () => void
  disabled: boolean
}

export function BettingBar({
  bet,
  bankroll,
  recommended,
  onBetChange,
  onDeal,
  disabled,
}: Props) {
  const chips = [1, 5, 25, 100]
  return (
    <div className="bet-row" data-tour="betting">
      {chips.map((c) => (
        <button
          key={c}
          type="button"
          className={`chip ${c >= 100 ? 'blue' : c >= 25 ? 'green' : 'red'}`}
          disabled={disabled}
          onClick={() => onBetChange(Math.min(bankroll, bet + c))}
          aria-label={`Add $${c}`}
        >
          ${c}
        </button>
      ))}
      <input
        type="number"
        min={1}
        max={bankroll}
        value={bet}
        disabled={disabled}
        onChange={(e) => onBetChange(Number(e.target.value))}
        aria-label="Bet amount"
      />
      <button
        type="button"
        className="btn"
        disabled={disabled}
        onClick={() => onBetChange(recommended)}
      >
        Rec ${recommended}
      </button>
      <button
        type="button"
        className="btn btn-primary"
        disabled={disabled || bet < 1 || bet > bankroll}
        onClick={onDeal}
      >
        Deal
      </button>
    </div>
  )
}
