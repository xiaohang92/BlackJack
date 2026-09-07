export type ShoeHint = {
  round: number
  shoeDecks: number
  cardsLeft: number
  cardsTotal: number
  decksRemaining: number
  shuffleNext: boolean
}

type Props = {
  baseUnit: number
  shoe: ShoeHint
  onClose: () => void
}

const RC_VALUES = [2, 4, 6, 8] as const

const DEVIATIONS = [
  { play: 'Insurance', when: 'TC ≥ +3' },
  { play: '16 vs 10', when: 'Stand at TC ≥ 0' },
  { play: '15 vs 10', when: 'Stand at TC ≥ +4' },
  { play: 'TT vs 5', when: 'Split at TC ≥ +5' },
  { play: 'TT vs 6', when: 'Split at TC ≥ +4' },
  { play: '10 vs 10', when: 'Double at TC ≥ +4' },
] as const

function deckColumns(shoeDecks: number): number[] {
  const want = [shoeDecks, 5, 4, 3, 2, 1].filter(
    (d) => d >= 1 && d <= shoeDecks,
  )
  return [...new Set(want)].sort((a, b) => b - a)
}

function nearestDeckCol(decksRemaining: number, cols: number[]): number {
  const first = cols[0]
  if (first === undefined) return 1
  let best = first
  let bestDist = Math.abs(decksRemaining - best)
  for (const col of cols) {
    const dist = Math.abs(decksRemaining - col)
    if (dist < bestDist) {
      best = col
      bestDist = dist
    }
  }
  return best
}

function tcAction(tc: number): 'min' | 'raise' | 'max' {
  if (tc < 2) return 'min'
  if (tc >= 4) return 'max'
  return 'raise'
}

function formatTc(tc: number): string {
  const rounded = Math.round(tc * 10) / 10
  const sign = rounded > 0 ? '+' : ''
  if (rounded % 1 === 0) return `${sign}${rounded.toFixed(0)}`
  return `${sign}${rounded.toFixed(1)}`
}

export function CheatSheet({ baseUnit, shoe, onClose }: Props) {
  const unit = Math.max(1, baseUnit)
  const bets = [
    { tc: '≤ +1', units: 1 },
    { tc: '+2', units: 2 },
    { tc: '+3', units: 3 },
    { tc: '+4', units: 4 },
    { tc: '≥ +5', units: 5 },
  ]
  const cols = deckColumns(shoe.shoeDecks)
  const activeCol = nearestDeckCol(shoe.decksRemaining, cols)

  return (
    <aside className="cheat-sheet" data-tour="cheat-sheet" aria-label="Count notes">
      <header className="cheat-head">
        <div>
          <h2>Notes</h2>
          <p>
            {shoe.shuffleNext
              ? 'Cut card is out. Count resets on the next shoe.'
              : `Round ${shoe.round} of this ${shoe.shoeDecks}-deck shoe.`}
          </p>
        </div>
        <button type="button" className="btn cheat-close" onClick={onClose} aria-label="Hide notes">
          Hide
        </button>
      </header>

      <div className="cheat-body">
        <section className="cheat-block">
          <h3>Hi-Lo</h3>
          <div className="hi-lo-strip">
            <div className="hi-lo plus">
              <strong>+1</strong>
              <span>2 3 4 5 6</span>
            </div>
            <div className="hi-lo zero">
              <strong>0</strong>
              <span>7 8 9</span>
            </div>
            <div className="hi-lo minus">
              <strong>−1</strong>
              <span>10 J Q K A</span>
            </div>
          </div>
        </section>

        <section className="cheat-block">
          <h3>True count</h3>
          <p className="cheat-note">
            TC = running count ÷ decks left. This shoe has{' '}
            <strong>
              {shoe.cardsLeft}/{shoe.cardsTotal}
            </strong>{' '}
            cards · <strong>{shoe.decksRemaining.toFixed(1)}</strong> decks left.
            Divide by {shoe.decksRemaining.toFixed(1)}.
          </p>
          <table className="cheat-table">
            <thead>
              <tr>
                <th>RC</th>
                {cols.map((d) => (
                  <th key={d} className={d === activeCol ? 'is-now' : undefined}>
                    {d}D
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RC_VALUES.map((rc) => (
                <tr key={rc}>
                  <th>+{rc}</th>
                  {cols.map((d) => {
                    const tc = rc / d
                    const action = tcAction(tc)
                    return (
                      <td
                        key={d}
                        className={`tc-${action}${d === activeCol ? ' is-now' : ''}`}
                      >
                        {formatTc(tc)}
                        <em>{action}</em>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="cheat-block">
          <h3>Bet ramp</h3>
          <div className="bet-ramp">
            {bets.map((b) => (
              <div key={b.tc} className="bet-ramp-cell">
                <span>TC {b.tc}</span>
                <strong>
                  {b.units}u · ${b.units * unit}
                </strong>
              </div>
            ))}
          </div>
        </section>

        <section className="cheat-block">
          <h3>Deviations</h3>
          <ul className="cheat-devs">
            {DEVIATIONS.map((d) => (
              <li key={d.play}>
                <span>{d.play}</span>
                <strong>{d.when}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="cheat-block">
          <h3>If you lose it</h3>
          <ul className="cheat-tips">
            <li>Drop to the table minimum. Wait for a new shoe.</li>
            <li>Speed: pair +1 with −1. They cancel. Count the rest.</li>
          </ul>
        </section>
      </div>
    </aside>
  )
}
