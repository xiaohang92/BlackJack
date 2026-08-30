import { useEffect, useMemo, useState, lazy, Suspense } from 'react'
import { recommendedBet } from './engine/betSizing'
import { trueCount } from './engine/hiLo'
import { cardsRemaining } from './engine/shoe'
import { ActionBar } from './components/ActionBar'
import { BettingBar } from './components/BettingBar'
import { CountModal } from './components/CountModal'
import { SettingsModal } from './components/SettingsModal'
import { DealerZone, PlayerZone } from './components/TableView'
import { TrainerPanel, type RailTab } from './components/TrainerPanel'
import { GuidedTour, tabForTourTarget } from './components/GuidedTour'
import { useGameStore } from './store/gameStore'
import { useSettingsStore } from './store/settingsStore'
import type { PlayerAction } from './engine/types'

const SimulationDashboard = lazy(() =>
  import('./components/SimulationDashboard').then((m) => ({
    default: m.SimulationDashboard,
  })),
)

const DISTRACTIONS = [
  'Waitress: "Can I get you a drink?"',
  'Player to your left: "Hit me, dealer!"',
  'Pit boss walks behind you…',
  'Someone drops chips on the felt.',
  'Phone rings at the next table.',
  'Dealer: "Insurance? Anyone?"',
]

export default function App() {
  const [view, setView] = useState<'table' | 'sim'>('table')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [forcedHint, setForcedHint] = useState<PlayerAction | null>(null)
  const [timerLeft, setTimerLeft] = useState(1)
  const [tourOpen, setTourOpen] = useState(false)
  const [railTab, setRailTab] = useState<RailTab>('count')

  const rules = useSettingsStore((s) => s.rules)
  const trainer = useSettingsStore((s) => s.trainer)
  const tourCompleted = useSettingsStore((s) => s.tourCompleted)
  const setTourCompleted = useSettingsStore((s) => s.setTourCompleted)
  const game = useGameStore((s) => s.game)
  const betInput = useGameStore((s) => s.betInput)
  const distraction = useGameStore((s) => s.distraction)
  const init = useGameStore((s) => s.init)
  const setBetInput = useGameStore((s) => s.setBetInput)
  const placeBet = useGameStore((s) => s.placeBet)
  const playerAction = useGameStore((s) => s.playerAction)
  const insurance = useGameStore((s) => s.insurance)
  const tickDealer = useGameStore((s) => s.tickDealer)
  const tickResolve = useGameStore((s) => s.tickResolve)
  const nextHand = useGameStore((s) => s.nextHand)
  const legal = useGameStore((s) => s.legal)
  const advice = useGameStore((s) => s.advice)
  const openCountModal = useGameStore((s) => s.openCountModal)
  const setDistraction = useGameStore((s) => s.setDistraction)
  const countModalOpen = useGameStore((s) => s.countModalOpen)

  useEffect(() => {
    init(rules, 1000)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!tourCompleted && view === 'table') {
      const t = setTimeout(() => setTourOpen(true), 400)
      return () => clearTimeout(t)
    }
  }, [tourCompleted, view])

  const finishTour = () => {
    setTourOpen(false)
    setTourCompleted(true)
  }

  const handleTourTarget = (target: string | undefined) => {
    const tab = tabForTourTarget(target)
    if (tab) setRailTab(tab)
  }
  useEffect(() => {
    if (countModalOpen) return
    if (game.phase.kind === 'blackjackCheck') {
      const t = setTimeout(() => {
        useGameStore.getState().dispatch({ type: 'DEAL_STEP' })
      }, 200)
      return () => clearTimeout(t)
    }
    if (game.phase.kind === 'dealerAction') {
      const t = setTimeout(() => tickDealer(), trainer.dealerSpeedMs)
      return () => clearTimeout(t)
    }
    if (game.phase.kind === 'payout') {
      const t = setTimeout(() => tickResolve(), trainer.dealerSpeedMs)
      return () => clearTimeout(t)
    }
  }, [
    game.phase,
    trainer.dealerSpeedMs,
    tickDealer,
    tickResolve,
    countModalOpen,
  ])

  // Periodic count check
  useEffect(() => {
    if (
      game.phase.kind === 'handComplete' &&
      trainer.countCheckEveryNHands > 0 &&
      game.handsPlayed > 0 &&
      game.handsPlayed % trainer.countCheckEveryNHands === 0
    ) {
      openCountModal()
    }
  }, [game.handsPlayed, game.phase.kind, trainer.countCheckEveryNHands, openCountModal])

  // Distractions mode during dealing / early play
  useEffect(() => {
    if (!trainer.distractionMode) return
    if (game.phase.kind !== 'dealing' && game.phase.kind !== 'playerAction') {
      return
    }
    if (Math.random() > 0.25) return
    const msg = DISTRACTIONS[Math.floor(Math.random() * DISTRACTIONS.length)]!
    setDistraction(msg)
    const t = setTimeout(() => setDistraction(null), 2800)
    return () => clearTimeout(t)
  }, [game.phase.kind, game.handsPlayed, trainer.distractionMode, setDistraction])

  // Decision timer
  useEffect(() => {
    if (!trainer.decisionTimerEnabled || countModalOpen) return
    const timed =
      game.phase.kind === 'betting' ||
      game.phase.kind === 'playerAction' ||
      game.phase.kind === 'insurance'
    if (!timed) {
      setTimerLeft(1)
      return
    }
    setTimerLeft(1)
    const start = Date.now()
    const total = trainer.decisionTimerSec * 1000
    const id = setInterval(() => {
      const left = 1 - (Date.now() - start) / total
      setTimerLeft(Math.max(0, left))
      if (left <= 0) {
        clearInterval(id)
        if (game.phase.kind === 'betting') {
          placeBet()
        } else if (game.phase.kind === 'insurance') {
          insurance(false)
        } else if (game.phase.kind === 'playerAction') {
          const a = advice()
          if (a && a.action !== 'insurance' && a.action !== 'noInsurance') {
            playerAction(a.action)
          } else {
            playerAction('stand')
          }
        }
      }
    }, 100)
    return () => clearInterval(id)
  }, [
    game.phase.kind,
    game.activeHandIndex,
    trainer.decisionTimerEnabled,
    trainer.decisionTimerSec,
    countModalOpen,
  ])

  const adv = advice()
  const hintAction: PlayerAction | null = useMemo(() => {
    if (forcedHint) return forcedHint
    if (!trainer.autoHint) return null
    if (!adv) return null
    if (adv.action === 'insurance' || adv.action === 'noInsurance') return null
    return adv.action
  }, [forcedHint, trainer.autoHint, adv])

  const recBet = useMemo(() => {
    const tc = trueCount(game.runningCount, cardsRemaining(game.shoe))
    const trunc =
      tc >= 0 ? Math.floor(tc) : Math.ceil(tc)
    return recommendedBet({
      bankroll: game.bankroll,
      trueCount: tc,
      trueCountTrunc: trunc,
      baseUnit: trainer.baseUnit,
      maxSpread: trainer.maxSpread,
      useKelly: trainer.useKelly,
      kellyFraction: trainer.kellyFraction,
    }).amount
  }, [game.runningCount, game.shoe, game.bankroll, trainer])

  if (view === 'sim') {
    return (
      <Suspense fallback={<div className="sim-page">Loading simulation…</div>}>
        <SimulationDashboard onBack={() => setView('table')} />
      </Suspense>
    )
  }

  const phase = game.phase.kind

  return (
    <div className="app-shell">
      <header className="top-bar">
        <h1 className="brand">
          Hi-Lo <span>Blackjack Trainer</span>
        </h1>
        <div className="top-actions">
          <div className="view-tabs">
            <button
              type="button"
              className="btn active"
              onClick={() => setView('table')}
            >
              Table
            </button>
            <button
              type="button"
              className="btn"
              data-tour="sim-btn"
              onClick={() => setView('sim')}
            >
              Simulation
            </button>
          </div>
          <button
            type="button"
            className="btn"
            onClick={() => setTourOpen(true)}
          >
            How to play
          </button>
          <button
            type="button"
            className="btn"
            data-tour="settings-btn"
            onClick={() => setSettingsOpen(true)}
          >
            Settings
          </button>
        </div>
      </header>

      <main className="main-table">
        <div className="felt" data-tour="felt">
          <DealerZone dealer={game.dealer} />
          {game.playerHands.length > 0 && (
            <PlayerZone
              hands={game.playerHands}
              activeIndex={game.activeHandIndex}
            />
          )}
        </div>

        <div className="status-bar">
          <div className="bankroll">Bankroll ${game.bankroll.toFixed(0)}</div>
          <div className="message">{game.lastMessage}</div>
          {trainer.decisionTimerEnabled &&
            (phase === 'betting' ||
              phase === 'playerAction' ||
              phase === 'insurance') && (
              <div style={{ width: '120px' }}>
                <div className="timer-bar">
                  <div className="fill" style={{ width: `${timerLeft * 100}%` }} />
                </div>
              </div>
            )}
        </div>

        <div className="controls-dock" data-tour="controls">
          {phase === 'betting' && (
            <BettingBar
              bet={betInput}
              bankroll={game.bankroll}
              recommended={Math.max(trainer.baseUnit, recBet)}
              onBetChange={setBetInput}
              onDeal={placeBet}
              disabled={countModalOpen || tourOpen}
            />
          )}

          {phase === 'insurance' && (
            <div className="action-bar">
              <button
                type="button"
                className={`btn btn-action ${
                  adv?.action === 'insurance' && trainer.autoHint ? 'is-hint' : ''
                }`}
                onClick={() => insurance(true)}
              >
                Take Insurance
              </button>
              <button
                type="button"
                className={`btn btn-action ${
                  adv?.action === 'noInsurance' && trainer.autoHint
                    ? 'is-hint'
                    : ''
                }`}
                onClick={() => insurance(false)}
              >
                No Insurance
              </button>
            </div>
          )}

          {phase === 'playerAction' && (
            <ActionBar
              legal={legal()}
              hint={hintAction}
              disabled={countModalOpen || tourOpen}
              onAction={(a) => {
                setForcedHint(null)
                playerAction(a)
              }}
              showHintButton={!trainer.autoHint}
              onHint={() => {
                const a = advice()
                if (a && a.action !== 'insurance' && a.action !== 'noInsurance') {
                  setForcedHint(a.action)
                }
              }}
            />
          )}

          {phase === 'handComplete' && (
            <div className="action-bar">
              <button
                type="button"
                className="btn btn-primary"
                onClick={nextHand}
              >
                Next Hand
              </button>
            </div>
          )}
        </div>
      </main>

      <TrainerPanel tab={railTab} onTabChange={setRailTab} />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onApply={() => init(rules, game.bankroll > 0 ? game.bankroll : 1000)}
      />
      <CountModal />

      {distraction && <div className="toast">{distraction}</div>}

      <GuidedTour
        open={tourOpen}
        onClose={finishTour}
        onStepTarget={handleTourTarget}
      />
    </div>
  )
}
