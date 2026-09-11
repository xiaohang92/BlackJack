import type { CSSProperties } from 'react'
import { chipTone, groupChips } from '../lib/chips'

type Props = {
  amount: number
  label?: boolean
}

export function ChipStack({ amount, label = true }: Props) {
  if (amount <= 0) {
    return (
      <div className="chip-stack is-empty" aria-hidden="true">
        <div className="bet-spot-ring" />
      </div>
    )
  }
  const columns = groupChips(amount)
  return (
    <div className="chip-stack" aria-label={`Bet $${amount}`}>
      <div className="chip-columns">
        {columns.map(({ value, count }) => (
          <div
            key={value}
            className="chip-pile"
            style={{ '--n': count } as CSSProperties}
          >
            {Array.from({ length: count }, (_, i) => (
              <div
                key={`${value}-${i}`}
                className={`table-chip ${chipTone(value)}`}
                style={{ '--i': i } as CSSProperties}
              >
                {i === count - 1 && (
                  <span className="chip-face">{value}</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      {label && <div className="chip-stack-amount">${amount}</div>}
    </div>
  )
}
