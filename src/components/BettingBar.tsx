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
  const canDeal = !disabled && bet >= minBet && bet <= bankroll

  return (
    <form
      className="bet-row"
      data-tour="betting"
      onSubmit={(e) => {
        e.preventDefault()
        if (canDeal) onDeal()
      }}
    >
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
            <span className="chip-face">{c}</span>
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
      <div className="bet-field">
        <label htmlFor="bet-amount">Bet</label>
        <span className="bet-field-value">
          <span className="bet-field-prefix" aria-hidden="true">
            $
          </span>
          <input
            id="bet-amount"
            name="bet"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            enterKeyHint="go"
            value={bet}
            disabled={disabled}
            onChange={(e) => {
              const next = e.target.value.replace(/\D/g, '')
              onBetChange(next === '' ? 0 : Number(next))
            }}
            aria-describedby="bet-min"
          />
        </span>
        <span id="bet-min" className="visually-hidden">
          Minimum ${minBet}
        </span>
      </div>
      <button
        type="submit"
        className="btn btn-primary btn-deal"
        disabled={!canDeal}
      >
        Deal
      </button>
    </form>
  )
}
