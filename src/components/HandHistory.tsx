import type { HandResult } from '../engine/types'

const SHORT: Record<HandResult, string> = {
  win: 'W',
  loss: 'L',
  push: 'P',
  blackjack: 'BJ',
  surrender: 'R',
}

type Props = {
  results: HandResult[]
}

export function HandHistory({ results }: Props) {
  if (results.length === 0) {
    return <div className="hand-history is-empty">No hands yet</div>
  }
  return (
    <ol className="hand-history" aria-label="Recent results">
      {results.map((r, i) => (
        <li key={`${r}-${i}`} className={`hist-pip ${r}`}>
          {SHORT[r]}
        </li>
      ))}
    </ol>
  )
}
