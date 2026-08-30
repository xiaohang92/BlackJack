import type { PlayerAction } from '../engine/types'

const LABELS: Record<PlayerAction, string> = {
  hit: 'Hit',
  stand: 'Stand',
  double: 'Double',
  split: 'Split',
  surrender: 'Surrender',
}

type Props = {
  legal: PlayerAction[]
  hint: PlayerAction | null
  disabled: boolean
  onAction: (a: PlayerAction) => void
  onHint: () => void
  showHintButton: boolean
}

export function ActionBar({
  legal,
  hint,
  disabled,
  onAction,
  onHint,
  showHintButton,
}: Props) {
  const all: PlayerAction[] = [
    'hit',
    'stand',
    'double',
    'split',
    'surrender',
  ]
  return (
    <div className="action-bar" data-tour="actions">
      {all.map((a) => (
        <button
          key={a}
          type="button"
          className={`btn btn-action ${hint === a ? 'is-hint' : ''}`}
          disabled={disabled || !legal.includes(a)}
          onClick={() => onAction(a)}
        >
          {LABELS[a]}
        </button>
      ))}
      {showHintButton && (
        <button type="button" className="btn btn-hint" onClick={onHint}>
          Hint
        </button>
      )}
    </div>
  )
}
