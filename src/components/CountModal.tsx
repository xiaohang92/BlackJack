import { useState, type FormEvent } from 'react'
import { useGameStore } from '../store/gameStore'
import { useSettingsStore } from '../store/settingsStore'
import { useStatsStore } from '../store/statsStore'

export function CountModal() {
  const open = useGameStore((s) => s.countModalOpen)
  const close = useGameStore((s) => s.closeCountModal)
  const submit = useGameStore((s) => s.submitCountGuess)
  const metrics = useGameStore((s) => s.metrics)
  const failOnLost = useSettingsStore((s) => s.trainer.failOnLostCount)
  const failSession = useStatsStore((s) => s.failSession)

  const [rc, setRc] = useState('')
  const [tc, setTc] = useState('')
  const [result, setResult] = useState<{
    rcOk: boolean
    tcOk: boolean
  } | null>(null)

  if (!open) return null

  const m = metrics()

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const graded = submit(Number(rc), Number(tc))
    setResult(graded)
    if (!graded.rcOk || !graded.tcOk) {
      if (failOnLost) failSession()
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal" role="dialog" aria-labelledby="count-title">
        <h2 id="count-title">Count Check</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--cream-dim)' }}>
          Counts are hidden. Enter the Running Count and True Count (truncated).
        </p>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="rc">Running Count</label>
            <input
              id="rc"
              type="number"
              value={rc}
              onChange={(e) => setRc(e.target.value)}
              required
            />
            {result && !result.rcOk && (
              <span className="field-error">
                Incorrect — actual RC is {m.runningCount}
              </span>
            )}
            {result?.rcOk && (
              <span style={{ color: 'var(--ok)', fontSize: '0.8rem' }}>
                Correct
              </span>
            )}
          </div>
          <div className="field">
            <label htmlFor="tc">True Count</label>
            <input
              id="tc"
              type="number"
              step="any"
              value={tc}
              onChange={(e) => setTc(e.target.value)}
              required
            />
            {result && !result.tcOk && (
              <span className="field-error">
                Incorrect — actual TC (trunc) is {m.trueCountTrunc}
              </span>
            )}
            {result?.tcOk && (
              <span style={{ color: 'var(--ok)', fontSize: '0.8rem' }}>
                Correct
              </span>
            )}
          </div>
          <div className="modal-actions">
            {!result && (
              <button type="submit" className="btn btn-primary">
                Submit
              </button>
            )}
            {result && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setResult(null)
                  setRc('')
                  setTc('')
                  close()
                }}
              >
                Continue
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
