import { chipTone } from '../lib/chips'

type Props = {
  bet: number
  bankroll: number
  recommended: number
  lastBet: number
  minBet: number
  disabled: boolean
  onBetChange: (n: number) => void
  onDeal: () => void
  onChip: (value: number) => void
  onUndo: () => void
  onClear: () => void
  onRebet: () => void
  showRecommended?: boolean
}

const CHIPS = [1, 5, 25, 100, 500]

export function BettingBar({
  bet,
  bankroll,
  recommended,
  lastBet,
  minBet,
  disabled,
  onBetChange,
  onDeal,
  onChip,
  onUndo,
  onClear,
  onRebet,
  showRecommended = true,
}: Props) {
  return (
    <div className="bet-row" data-tour="betting">
      <div className="chip-tray" role="group" aria-label="Chips">
        {CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            className={`chip ${chipTone(c)}`}
            disabled={disabled || c > bankroll}
            onClick={() => onChip(c)}
            aria-label={`Add $${c}`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="bet-tools">
        <button
          type="button"
          className="btn"
          disabled={disabled || bet <= 0}
          onClick={onUndo}
        >
          Undo
        </button>
        <button
          type="button"
          className="btn"
          disabled={disabled || bet <= 0}
          onClick={onClear}
        >
          Clear
        </button>
        <button
          type="button"
          className="btn"
          disabled={disabled || lastBet < minBet || lastBet > bankroll}
          onClick={onRebet}
        >
          Rebet{lastBet > 0 ? ` $${lastBet}` : ''}
        </button>
        {showRecommended && (
          <button
            type="button"
            className="btn"
            disabled={disabled}
            onClick={() => onBetChange(Math.min(bankroll, recommended))}
          >
            Rec ${recommended}
          </button>
        )}
      </div>
      <div className="bet-amount-wrap">
        <span className="bet-min-max">Min ${minBet}</span>
        <input
          type="number"
          min={0}
          max={bankroll}
          value={bet}
          disabled={disabled}
          onChange={(e) => onBetChange(Number(e.target.value))}
          aria-label="Bet amount"
        />
      </div>
      <button
        type="button"
        className="btn btn-primary btn-deal"
        disabled={disabled || bet < minBet || bet > bankroll}
        onClick={onDeal}
      >
        Deal
      </button>
    </div>
  )
}
