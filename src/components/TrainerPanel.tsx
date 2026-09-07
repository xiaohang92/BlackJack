import { formatEdgePercent, playerEdge } from '../engine/ev'
import { useGameStore } from '../store/gameStore'
import { useSettingsStore } from '../store/settingsStore'
import { useStatsStore } from '../store/statsStore'
import { DiscardTray } from './DiscardTray'

export type RailTab = 'count' | 'stats' | 'options'

type Props = {
  tab: RailTab
  onTabChange: (tab: RailTab) => void
}

export function TrainerPanel({ tab, onTabChange }: Props) {
  const trainer = useSettingsStore((s) => s.trainer)
  const setTrainer = useSettingsStore((s) => s.setTrainer)
  const metrics = useGameStore((s) => s.metrics)
  const openCountModal = useGameStore((s) => s.openCountModal)
  const countHidden = useGameStore((s) => s.countModalOpen)
  const stats = useStatsStore()
  const m = metrics()

  const edge = playerEdge(m.trueCountTrunc)
  const bsAcc =
    stats.basicDecisions > 0
      ? ((stats.basicCorrect / stats.basicDecisions) * 100).toFixed(0)
      : '—'
  const idxAcc =
    stats.indexDecisions > 0
      ? ((stats.indexCorrect / stats.indexDecisions) * 100).toFixed(0)
      : '—'
  const countAcc =
    stats.countPrompts > 0
      ? ((stats.countCorrect / stats.countPrompts) * 100).toFixed(0)
      : '—'

  return (
    <aside className="side-panel" data-tour="trainer-rail">
      <div className="rail-tabs" role="tablist" aria-label="Trainer">
        {(
          [
            ['count', 'Count'],
            ['stats', 'Stats'],
            ['options', 'Options'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`rail-tab ${tab === id ? 'active' : ''}`}
            onClick={() => onTabChange(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rail-body">
        {tab === 'count' && (
          <div className="panel panel-fill" data-tour="count-panel">
            <div className="count-grid">
              {trainer.showRunningCount && (
                <div className="count-metric">
                  <span>RC</span>
                  <strong>{countHidden ? '??' : m.runningCount}</strong>
                </div>
              )}
              {trainer.showTrueCount && (
                <div className="count-metric">
                  <span>TC</span>
                  <strong>
                    {countHidden ? '??' : m.trueCountTrunc}
                  </strong>
                </div>
              )}
              {trainer.showDecksRemaining && !trainer.discardTrayMode && (
                <div className="count-metric">
                  <span>Decks</span>
                  <strong>
                    {countHidden ? '??' : m.decksRemaining.toFixed(1)}
                  </strong>
                </div>
              )}
              <div className="count-metric">
                <span>EV</span>
                <strong>{formatEdgePercent(edge)}</strong>
              </div>
            </div>
            {trainer.discardTrayMode && (
              <DiscardTray ratio={m.discardRatio} label="Discards" />
            )}
            <button
              type="button"
              className="btn btn-primary"
              data-tour="verify-count"
              onClick={openCountModal}
            >
              Verify Count
            </button>
          </div>
        )}

        {tab === 'stats' && (
          <div className="panel panel-fill">
            <div className="stat-row">
              <span>Hands</span>
              <strong>{stats.handsPlayed}</strong>
            </div>
            <div className="stat-row">
              <span>W / L / P</span>
              <strong>
                {stats.wins}/{stats.losses}/{stats.pushes}
              </strong>
            </div>
            <div className="stat-row">
              <span>Basic</span>
              <strong>{bsAcc}%</strong>
            </div>
            <div className="stat-row">
              <span>Index</span>
              <strong>{idxAcc}%</strong>
            </div>
            <div className="stat-row">
              <span>Count</span>
              <strong>{countAcc}%</strong>
            </div>
            {stats.lastErrorKind && (
              <div className={`error-banner ${stats.lastErrorKind}`}>
                {stats.lastErrorMessage}
              </div>
            )}
            {stats.sessionFailed && (
              <div className="error-banner basic">Session failed</div>
            )}
            <button
              type="button"
              className="btn"
              onClick={() => stats.reset()}
            >
              Reset Stats
            </button>
          </div>
        )}

        {tab === 'options' && (
          <div className="panel panel-fill" data-tour="trainer-toggles">
            <div className="options-grid">
              {(
                [
                  ['showRunningCount', 'Show RC'],
                  ['showTrueCount', 'Show TC'],
                  ['showDecksRemaining', 'Show decks'],
                  ['autoHint', 'Auto-Hint'],
                  ['useKelly', 'Kelly bets'],
                  ['discardTrayMode', 'Discard tray'],
                  ['distractionMode', 'Distractions'],
                  ['failOnLostCount', 'Fail if lost'],
                  ['soundEnabled', 'Sound'],
                  ['autoNextHand', 'Auto next'],
                  ['decisionTimerEnabled', 'Timer'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="opt-chip">
                  <input
                    type="checkbox"
                    checked={
                      key === 'soundEnabled'
                        ? trainer.soundEnabled !== false
                        : Boolean(trainer[key])
                    }
                    onChange={(e) =>
                      setTrainer({ [key]: e.target.checked })
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="options-fields">
              <label>
                Speed
                <select
                  value={trainer.dealerSpeedMs}
                  onChange={(e) =>
                    setTrainer({ dealerSpeedMs: Number(e.target.value) })
                  }
                >
                  <option value={150}>Fast</option>
                  <option value={400}>Normal</option>
                  <option value={800}>Slow</option>
                </select>
              </label>
              <label>
                Unit $
                <input
                  type="number"
                  value={trainer.baseUnit}
                  onChange={(e) =>
                    setTrainer({
                      baseUnit: Math.max(1, Number(e.target.value)),
                    })
                  }
                />
              </label>
              <label>
                Spread
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={trainer.maxSpread}
                  onChange={(e) =>
                    setTrainer({
                      maxSpread: Math.min(
                        12,
                        Math.max(1, Number(e.target.value)),
                      ),
                    })
                  }
                />
              </label>
              <label>
                Kelly
                <select
                  value={trainer.kellyFraction}
                  onChange={(e) =>
                    setTrainer({
                      kellyFraction: Number(e.target.value) as 1 | 0.5 | 0.25,
                    })
                  }
                >
                  <option value={1}>Full</option>
                  <option value={0.5}>Half</option>
                  <option value={0.25}>¼</option>
                </select>
              </label>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
