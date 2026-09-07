import { useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react'
import { recommendedBet } from './engine/betSizing'
import { trueCount } from './engine/hiLo'
import { cardsRemaining } from './engine/shoe'
import { ActionBar } from './components/ActionBar'
import { BettingBar } from './components/BettingBar'
import { CountModal } from './components/CountModal'
import { SettingsModal } from './components/SettingsModal'
import { FeltTable } from './components/TableView'
import { TrainerPanel, type RailTab } from './components/TrainerPanel'
import { GuidedTour, tabForTourTarget } from './components/GuidedTour'
import { HandHistory } from './components/HandHistory'
import { useGameStore } from './store/gameStore'
import { useSettingsStore } from './store/settingsStore'
import { useStatsStore } from './store/statsStore'
import type { PlayerAction } from './engine/types'
import {
  playBlackjack,
  playChip,
  playDeal,
  playDealSequence,
  playFlip,
  playLose,
  playPush,
  playShuffle,
  playWin,
  setSoundEnabled,
  unlockAudio,
} from './audio/tableSounds'

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

const INITIAL_DEAL_MS = 220 * 3 + 560

export default function App() {
  const [view, setView] = useState<'table' | 'sim'>('table')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [forcedHint, setForcedHint] = useState<PlayerAction | null>(null)
  const [timerLeft, setTimerLeft] = useState(1)
  const [tourOpen, setTourOpen] = useState(false)
  const [railTab, setRailTab] = useState<RailTab>('count')
  const [animLock, setAnimLock] = useState(false)
  const [shuffling, setShuffling] = useState(false)
  const [peeking, setPeeking] = useState(false)

  const rules = useSettingsStore((s) => s.rules)
  const trainer = useSettingsStore((s) => s.trainer)
  const tourCompleted = useSettingsStore((s) => s.tourCompleted)
  const setTourCompleted = useSettingsStore((s) => s.setTourCompleted)
  const setTrainer = useSettingsStore((s) => s.setTrainer)
  const game = useGameStore((s) => s.game)
  const betInput = useGameStore((s) => s.betInput)
  const lastBet = useGameStore((s) => s.lastBet)
  const distraction = useGameStore((s) => s.distraction)
  const init = useGameStore((s) => s.init)
  const setBetInput = useGameStore((s) => s.setBetInput)
  const addChip = useGameStore((s) => s.addChip)
  const undoChip = useGameStore((s) => s.undoChip)
  const clearBet = useGameStore((s) => s.clearBet)
  const rebet = useGameStore((s) => s.rebet)
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
  const recentResults = useStatsStore((s) => s.recentResults)

  const prevHole = useRef(true)
  const prevCardCount = useRef(0)
  const prevPhase = useRef(game.phase.kind)
  const dealLockUntil = useRef(0)

  useEffect(() => {
    init(rules, 1000)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setSoundEnabled(trainer.soundEnabled !== false)
  }, [trainer.soundEnabled])

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

  const beginDeal = () => {
    unlockAudio()
    if (betInput < 1 || betInput > game.bankroll) return
    const needsShuffle = game.shoe.needsShuffle
    setAnimLock(true)
    const afterShuffle = () => {
      setShuffling(false)
      placeBet()
      playDealSequence(4, 0.22)
      dealLockUntil.current = Date.now() + INITIAL_DEAL_MS
      window.setTimeout(() => setAnimLock(false), INITIAL_DEAL_MS)
    }
    if (needsShuffle) {
      setShuffling(true)
      playShuffle()
      window.setTimeout(afterShuffle, 950)
    } else {
      afterShuffle()
    }
  }

  useEffect(() => {
    if (countModalOpen || shuffling) return
    if (game.phase.kind === 'blackjackCheck') {
      const remaining = Math.max(0, dealLockUntil.current - Date.now())
      const wait = remaining + 280
      setPeeking(remaining <= 0)
      const peekT = setTimeout(() => setPeeking(true), remaining)
      const t = setTimeout(() => {
        setPeeking(false)
        useGameStore.getState().dispatch({ type: 'DEAL_STEP' })
      }, wait)
      return () => {
        clearTimeout(t)
        clearTimeout(peekT)
        setPeeking(false)
      }
    }
    if (game.phase.kind === 'dealerAction') {
      const revealWait = game.dealer.holeHidden
        ? Math.max(trainer.dealerSpeedMs, 560)
        : trainer.dealerSpeedMs
      const t = setTimeout(() => tickDealer(), revealWait)
      return () => clearTimeout(t)
    }
    if (game.phase.kind === 'payout') {
      const t = setTimeout(() => tickResolve(), Math.max(trainer.dealerSpeedMs, 380))
      return () => clearTimeout(t)
    }
  }, [
    game.phase,
    game.dealer.holeHidden,
    trainer.dealerSpeedMs,
    tickDealer,
    tickResolve,
    countModalOpen,
    shuffling,
  ])

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

  useEffect(() => {
    if (!trainer.autoNextHand) return
    if (game.phase.kind !== 'handComplete' || countModalOpen || tourOpen) return
    const t = setTimeout(() => nextHand(), 1700)
    return () => clearTimeout(t)
  }, [game.phase.kind, trainer.autoNextHand, countModalOpen, tourOpen, nextHand])

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

  useEffect(() => {
    if (!trainer.decisionTimerEnabled || countModalOpen || animLock) return
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
          beginDeal()
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
    animLock,
  ])

  const cardCount =
    game.dealer.cards.length +
    game.playerHands.reduce((n, h) => n + h.cards.length, 0)

  useEffect(() => {
    if (cardCount > prevCardCount.current && prevCardCount.current > 0) {
      const added = cardCount - prevCardCount.current
      if (added === 1) playDeal()
      else if (added > 1) playDealSequence(added, 0.18)
    }
    prevCardCount.current = cardCount
  }, [cardCount])

  useEffect(() => {
    if (prevHole.current && !game.dealer.holeHidden && game.dealer.cards.length >= 2) {
      playFlip()
    }
    prevHole.current = game.dealer.holeHidden
  }, [game.dealer.holeHidden, game.dealer.cards.length])

  useEffect(() => {
    if (prevPhase.current !== 'handComplete' && game.phase.kind === 'handComplete') {
      const kinds = new Set(game.lastPayouts.map((p) => p.result))
      if (kinds.has('blackjack')) playBlackjack()
      else if (kinds.has('win')) playWin()
      else if (kinds.has('push')) playPush()
      else playLose()
    }
    prevPhase.current = game.phase.kind
  }, [game.phase.kind, game.lastPayouts])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA')) {
        return
      }
      if (countModalOpen || settingsOpen || tourOpen || shuffling) return
      const key = e.key.toLowerCase()
      const phase = game.phase.kind

      if (phase === 'betting') {
        if (key === ' ' || key === 'enter') {
          e.preventDefault()
          beginDeal()
          return
        }
        if (key === 'c') {
          clearBet()
          return
        }
        if (key === 'backspace') {
          e.preventDefault()
          undoChip()
          return
        }
        if (key === 'b') {
          rebet()
          return
        }
        const chipMap: Record<string, number> = {
          '1': 1,
          '2': 5,
          '3': 25,
          '4': 100,
          '5': 500,
        }
        if (chipMap[key]) {
          addChip(chipMap[key]!)
          playChip()
        }
        return
      }

      if (phase === 'insurance') {
        if (key === 'i' || key === 'y') insurance(true)
        if (key === 'n' || key === 's') insurance(false)
        return
      }

      if (phase === 'playerAction' && !animLock) {
        const map: Record<string, PlayerAction> = {
          h: 'hit',
          s: 'stand',
          d: 'double',
          p: 'split',
          '2': 'split',
          r: 'surrender',
          u: 'surrender',
        }
        const action = map[key]
        if (action && legal().includes(action)) {
          e.preventDefault()
          setForcedHint(null)
          playerAction(action)
        }
        return
      }

      if (phase === 'handComplete' && (key === ' ' || key === 'enter' || key === 'n')) {
        e.preventDefault()
        nextHand()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

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
    const trunc = tc >= 0 ? Math.floor(tc) : Math.ceil(tc)
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
  const controlsLocked = countModalOpen || tourOpen || animLock || shuffling
  const soundOn = trainer.soundEnabled !== false

  return (
    <div className="app-shell">
      <header className="top-bar">
        <h1 className="brand">
          Hi-Lo <span>Blackjack Trainer</span>
        </h1>
        <HandHistory results={recentResults} />
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
            className={`btn btn-icon ${soundOn ? 'is-on' : ''}`}
            aria-pressed={soundOn}
            aria-label={soundOn ? 'Mute sounds' : 'Unmute sounds'}
            onClick={() => {
              unlockAudio()
              setTrainer({ soundEnabled: !soundOn })
            }}
          >
            {soundOn ? '🔊' : '🔇'}
          </button>
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
        <FeltTable
          game={game}
          rules={rules}
          betInput={betInput}
          peeking={peeking}
          shuffling={shuffling}
        />

        <div className="status-bar">
          <div className="bankroll">Bankroll ${game.bankroll.toFixed(0)}</div>
          <div className="message">{game.lastMessage}</div>
          <div className="kbd-hint">
            {phase === 'betting' && 'Space deal · 1–5 chips · B rebet · C clear'}
            {phase === 'playerAction' && 'H hit · S stand · D double · P split · R surrender'}
            {phase === 'insurance' && 'I insurance · N no'}
            {phase === 'handComplete' && 'Space next hand'}
          </div>
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
              lastBet={lastBet}
              minBet={1}
              onBetChange={setBetInput}
              onChip={(v) => {
                unlockAudio()
                playChip()
                addChip(v)
              }}
              onUndo={undoChip}
              onClear={clearBet}
              onRebet={() => {
                playChip()
                rebet()
              }}
              onDeal={beginDeal}
              disabled={controlsLocked}
            />
          )}

          {phase === 'insurance' && (
            <div className="action-bar">
              <button
                type="button"
                className={`btn btn-action ${
                  adv?.action === 'insurance' && trainer.autoHint ? 'is-hint' : ''
                }`}
                disabled={controlsLocked}
                onClick={() => insurance(true)}
              >
                Take Insurance
                <kbd>I</kbd>
              </button>
              <button
                type="button"
                className={`btn btn-action ${
                  adv?.action === 'noInsurance' && trainer.autoHint
                    ? 'is-hint'
                    : ''
                }`}
                disabled={controlsLocked}
                onClick={() => insurance(false)}
              >
                No Insurance
                <kbd>N</kbd>
              </button>
            </div>
          )}

          {phase === 'playerAction' && (
            <ActionBar
              legal={legal()}
              hint={hintAction}
              disabled={controlsLocked}
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
                className="btn btn-primary btn-deal"
                onClick={nextHand}
              >
                Next Hand
                <kbd>␣</kbd>
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
