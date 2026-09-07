import type { CSSProperties } from 'react'
import { breakdownChips, chipTone } from '../lib/chips'

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
  const chips = breakdownChips(amount)
  return (
    <div className="chip-stack" aria-label={`Bet $${amount}`}>
      {chips.map((v, i) => (
        <div
          key={`${v}-${i}`}
          className={`table-chip ${chipTone(v)}`}
          style={{ '--i': i } as CSSProperties}
        >
          <span>{v >= 100 ? v : ''}</span>
        </div>
      ))}
      {label && <div className="chip-stack-amount">${amount}</div>}
    </div>
  )
}
