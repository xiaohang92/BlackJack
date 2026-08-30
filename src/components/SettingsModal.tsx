import { useSettingsStore } from '../store/settingsStore'
import type { RulesConfig } from '../engine/types'

type Props = {
  open: boolean
  onClose: () => void
  onApply: () => void
}

export function SettingsModal({ open, onClose, onApply }: Props) {
  const rules = useSettingsStore((s) => s.rules)
  const setRules = useSettingsStore((s) => s.setRules)
  const resetRules = useSettingsStore((s) => s.resetRules)

  if (!open) return null

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-labelledby="settings-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="settings-title">Game Rules</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--cream-dim)' }}>
          Defaults match Vegas Casino Standard (6D, 75%, S17, 3:2, DAS, LS).
        </p>
        <div className="settings-grid">
          <div className="field">
            <label htmlFor="decks">Number of Decks</label>
            <select
              id="decks"
              value={rules.decks}
              onChange={(e) =>
                setRules({
                  decks: Number(e.target.value) as RulesConfig['decks'],
                })
              }
            >
              {[1, 2, 4, 6, 8].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="pen">Deck Penetration ({Math.round(rules.penetration * 100)}%)</label>
            <input
              id="pen"
              type="range"
              min={50}
              max={85}
              step={5}
              value={rules.penetration * 100}
              onChange={(e) =>
                setRules({ penetration: Number(e.target.value) / 100 })
              }
            />
          </div>
          <div className="toggle-row">
            <label>
              <input
                type="checkbox"
                checked={rules.hitSoft17}
                onChange={(e) => setRules({ hitSoft17: e.target.checked })}
              />
              Dealer Hits Soft 17 (H17)
            </label>
          </div>
          <div className="field">
            <label htmlFor="bjpay">Blackjack Payout</label>
            <select
              id="bjpay"
              value={rules.blackjackPayout}
              onChange={(e) =>
                setRules({
                  blackjackPayout: e.target.value as '3:2' | '6:5',
                })
              }
            >
              <option value="3:2">3:2</option>
              <option value="6:5">6:5</option>
            </select>
          </div>
          <div className="toggle-row">
            <label>
              <input
                type="checkbox"
                checked={rules.doubleAfterSplit}
                onChange={(e) =>
                  setRules({ doubleAfterSplit: e.target.checked })
                }
              />
              Double After Split (DAS)
            </label>
          </div>
          <div className="toggle-row">
            <label>
              <input
                type="checkbox"
                checked={rules.lateSurrender}
                onChange={(e) =>
                  setRules({ lateSurrender: e.target.checked })
                }
              />
              Late Surrender
            </label>
          </div>
          <div className="toggle-row">
            <label>
              <input
                type="checkbox"
                checked={rules.resplitAces}
                onChange={(e) => setRules({ resplitAces: e.target.checked })}
              />
              Resplit Aces
            </label>
          </div>
          <div className="field">
            <label htmlFor="maxsplit">Max Split Hands</label>
            <select
              id="maxsplit"
              value={rules.maxSplitHands}
              onChange={(e) =>
                setRules({ maxSplitHands: Number(e.target.value) })
              }
            >
              {[2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={resetRules}>
            Reset Vegas
          </button>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              onApply()
              onClose()
            }}
          >
            Apply & New Shoe
          </button>
        </div>
      </div>
    </div>
  )
}
