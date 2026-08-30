import { useState } from 'react'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import {
  estimateRiskOfRuin,
  runSimulation,
  type SimResult,
} from '../engine/monteCarlo'
import { useSettingsStore } from '../store/settingsStore'

export function SimulationDashboard({ onBack }: { onBack: () => void }) {
  const rules = useSettingsStore((s) => s.rules)
  const trainer = useSettingsStore((s) => s.trainer)
  const [hands, setHands] = useState(10000)
  const [bankroll, setBankroll] = useState(10000)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<SimResult | null>(null)
  const [rorTrials, setRorTrials] = useState(0)

  const run = () => {
    setRunning(true)
    // Yield so UI can paint
    setTimeout(() => {
      const sim = runSimulation({
        hands,
        startingBankroll: bankroll,
        rules,
        baseUnit: trainer.baseUnit,
        maxSpread: trainer.maxSpread,
        useKelly: trainer.useKelly,
        kellyFraction: trainer.kellyFraction,
        seed: 42,
      })
      const trials = hands >= 100000 ? 20 : 50
      const ror = estimateRiskOfRuin(
        {
          hands: Math.min(hands, 5000),
          startingBankroll: bankroll,
          rules,
          baseUnit: trainer.baseUnit,
          maxSpread: trainer.maxSpread,
          useKelly: trainer.useKelly,
          kellyFraction: trainer.kellyFraction,
          seed: 99,
        },
        Math.min(trials, 30),
      )
      setResult(sim)
      setRorTrials(ror)
      setRunning(false)
    }, 50)
  }

  const chartData =
    result?.bankrollSeries
      .filter((_, i) => i % Math.max(1, Math.floor(result.bankrollSeries.length / 500)) === 0)
      .map((b, i) => ({ hand: i, bankroll: Math.round(b) })) ?? []

  return (
    <div className="sim-page">
      <div className="top-bar" style={{ marginBottom: '1rem' }}>
        <h1 className="brand">
          Monte Carlo <span>Simulation</span>
        </h1>
        <button type="button" className="btn" onClick={onBack}>
          Back to Table
        </button>
      </div>

      <div className="panel">
        <h2>Inputs</h2>
        <div className="sim-form">
          <div className="field">
            <label htmlFor="hands">Hands</label>
            <select
              id="hands"
              value={hands}
              onChange={(e) => setHands(Number(e.target.value))}
            >
              <option value={1000}>1,000</option>
              <option value={10000}>10,000</option>
              <option value={100000}>100,000</option>
              <option value={1000000}>1,000,000</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="br">Starting Bankroll</label>
            <input
              id="br"
              type="number"
              value={bankroll}
              onChange={(e) => setBankroll(Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>Bet mode</label>
            <div style={{ paddingTop: '0.4rem' }}>
              {trainer.useKelly
                ? `Kelly ×${trainer.kellyFraction}`
                : `Spread 1–${trainer.maxSpread}`}
            </div>
          </div>
          <div className="field">
            <label>Unit / Rules</label>
            <div style={{ paddingTop: '0.4rem' }}>
              ${trainer.baseUnit} · {rules.decks}D ·{' '}
              {rules.hitSoft17 ? 'H17' : 'S17'}
            </div>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          disabled={running}
          onClick={run}
        >
          {running ? 'Running…' : 'Run Simulation'}
        </button>
      </div>

      {result && (
        <>
          <div className="panel" style={{ marginTop: '1rem' }}>
            <h2>Results</h2>
            <div className="stat-row">
              <span>Final bankroll</span>
              <strong>${result.finalBankroll.toFixed(0)}</strong>
            </div>
            <div className="stat-row">
              <span>Peak</span>
              <strong>${result.peak.toFixed(0)}</strong>
            </div>
            <div className="stat-row">
              <span>Trough</span>
              <strong>${result.trough.toFixed(0)}</strong>
            </div>
            <div className="stat-row">
              <span>Hands played</span>
              <strong>{result.handsPlayed.toLocaleString()}</strong>
            </div>
            <div className="stat-row">
              <span>Risk of Ruin (est.)</span>
              <strong>{(rorTrials * 100).toFixed(1)}%</strong>
            </div>
            <div className="stat-row">
              <span>Path ruined</span>
              <strong>{result.ruined ? 'Yes' : 'No'}</strong>
            </div>
          </div>
          <div className="chart-wrap" style={{ marginTop: '1rem' }}>
            <h2 style={{ color: 'var(--gold)', marginBottom: '0.75rem' }}>
              Bankroll Trajectory
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="rgba(42,74,60,0.5)" />
                <XAxis dataKey="hand" stroke="#d4c4a0" hide />
                <YAxis stroke="#d4c4a0" />
                <Tooltip
                  contentStyle={{
                    background: '#12241c',
                    border: '1px solid #2a4a3c',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="bankroll"
                  stroke="#d4a017"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}
