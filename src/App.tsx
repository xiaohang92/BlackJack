import { useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react'
import { recommendedBet } from './engine/betSizing'
import { remainingDecksRounded, trueCount } from './engine/hiLo'
import { cardsRemaining } from './engine/shoe'
import { shoeRound } from './engine/gameMachine'
import { ActionBar } from './components/ActionBar'
import { BettingBar } from './components/BettingBar'
import { CheatSheet } from './components/CheatSheet'
import { CountModal } from './components/CountModal'
import { SettingsModal } from './components/SettingsModal'
import { FeltTable } from './components/TableView'
import { ShoeStrip } from './components/ShoeStrip'
import { TrainerPanel, type RailTab } from './components/TrainerPanel'
import { GuidedTour, tabForTourTarget } from './components/GuidedTour'
import { HandHistory } from './components/HandHistory'
import { useGameStore } from './store/gameStore'
import { useSettingsStore } from './store/settingsStore'
import { useStatsStore } from './store/statsStore'
import { describeNextStep } from './engine/nextStep'
import { formatNet, netTotal, overallTone, resultTitle } from './engine/resultView'
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

const INITIAL_DEAL_MS = 320 * 3 + 720

export default function App() {
  const [view, setView] = useState<'table' | 'sim'>('table')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [forcedHint, setForcedHint] = useState<PlayerAction | null>(null)
  const [hintOpen, setHintOpen] = useState(false)
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
  const notesOpen = trainer.cheatSheetOpen
  const isPlay = trainer.tableMood !== 'train'
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
  const winStreak = useStatsStore((s) => s.winStreak)
  const coldStreak = useStatsStore((s) => s.coldStreak)

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
    setTrainer({ tableMood: 'play' })
  }

  const handleTourTarget = (target: string | undefined) => {
    const tab = tabForTourTarget(target)
    if (tab) {
      setRailTab(tab)
      setTrainer({ tableMood: 'train' })
    } else if (
      target === 'felt' ||
      target === 'betting' ||
      target === 'controls' ||
      target === 'mood-tabs'
    ) {
      setTrainer({ tableMood: 'play' })
    }
    if (target === 'cheat-sheet' || target === 'notes-btn') {
      setTrainer({ cheatSheetOpen: true })
    }
  }

  const beginDeal = () => {
    unlockAudio()
    if (betInput < 1 || betInput > game.bankroll) return
    const needsShuffle = game.shoe.needsShuffle
    setAnimLock(true)
    const afterShuffle = () => {
      setShuffling(false)
      placeBet()
      playDealSequence(4, 0.32)
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
    game.phase.kind,
    game.dealer.holeHidden,
    game.dealer.cards.length,
    trainer.dealerSpeedMs,
    tickDealer,
    tickResolve,
    countModalOpen,
    shuffling,
  ])

  useEffect(() => {
    if (isPlay || notesOpen) return
    if (
      game.phase.kind === 'handComplete' &&
      trainer.countCheckEveryNHands > 0 &&
      game.handsPlayed > 0 &&
      game.handsPlayed % trainer.countCheckEveryNHands === 0
    ) {
      openCountModal()
    }
  }, [
    game.handsPlayed,
    game.phase.kind,
    trainer.countCheckEveryNHands,
    notesOpen,
    isPlay,
    openCountModal,
  ])

  useEffect(() => {
    if (!trainer.autoNextHand) return
    if (game.phase.kind !== 'handComplete' || countModalOpen || tourOpen) return
    const t = setTimeout(() => nextHand(), 1700)
    return () => clearTimeout(t)
  }, [game.phase.kind, trainer.autoNextHand, countModalOpen, tourOpen, nextHand])

  useEffect(() => {
    if (isPlay || !trainer.distractionMode) return
    if (game.phase.kind !== 'dealing' && game.phase.kind !== 'playerAction') {
      return
    }
    if (Math.random() > 0.25) return
    const msg = DISTRACTIONS[Math.floor(Math.random() * DISTRACTIONS.length)]!
    setDistraction(msg)
    const t = setTimeout(() => setDistraction(null), 2800)
    return () => clearTimeout(t)
  }, [game.phase.kind, game.handsPlayed, trainer.distractionMode, isPlay, setDistraction])

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

  useEffect(() => {
    setHintOpen(false)
    setForcedHint(null)
  }, [game.phase.kind, game.activeHandIndex])

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

  const recAmount = Math.max(trainer.baseUnit, recBet)
  const shoeHint = {
    round: shoeRound(game),
    shoeDecks: game.rules.decks,
    cardsLeft: cardsRemaining(game.shoe),
    cardsTotal: game.rules.decks * 52,
    decksRemaining: remainingDecksRounded(cardsRemaining(game.shoe)),
    shuffleNext: game.shoe.needsShuffle,
  }
  const step = describeNextStep({
    phase: game.phase.kind,
    advice: adv,
    recBet: recAmount,
    game,
  })
  const revealHint = () => {
    setHintOpen(true)
    if (adv && adv.action !== 'insurance' && adv.action !== 'noInsurance') {
      setForcedHint(adv.action)
    }
  }

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
  const settled = phase === 'handComplete' && game.lastPayouts.length > 0
  const settleTone = settled ? overallTone(game.lastPayouts) : null
  const settleNet = settled ? netTotal(game.lastPayouts) : 0

  return (
    <div className={`app-shell${isPlay ? ' mood-play' : ' mood-train'}`}>
      <header className="top-bar">
        <h1 className="brand">
          Hi-Lo <span>Blackjack</span>
        </h1>
        <HandHistory results={recentResults} />
        <div className="top-actions">
          <div className="view-tabs" data-tour="mood-tabs">
            <button
              type="button"
              className={`btn ${isPlay ? 'active' : ''}`}
              aria-pressed={isPlay}
              onClick={() => setTrainer({ tableMood: 'play' })}
            >
              Play
            </button>
            <button
              type="button"
              className={`btn ${!isPlay ? 'active' : ''}`}
              aria-pressed={!isPlay}
              data-tour="train-btn"
              onClick={() => setTrainer({ tableMood: 'train' })}
            >
              Train
            </button>
          </div>
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
            className={`btn ${notesOpen ? 'active' : ''}`}
            data-tour="notes-btn"
            aria-pressed={notesOpen}
            onClick={() => setTrainer({ cheatSheetOpen: !notesOpen })}
          >
            Notes
          </button>
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

      <main className={`main-table${notesOpen ? ' with-notes' : ''}`}>
        {notesOpen && (
          <CheatSheet
            baseUnit={trainer.baseUnit}
            shoe={shoeHint}
            onClose={() => setTrainer({ cheatSheetOpen: false })}
          />
        )}
        <FeltTable
          game={game}
          rules={rules}
          betInput={betInput}
          peeking={peeking}
          shuffling={shuffling}
          loud={isPlay}
        />

        <div className="status-bar">
          <div
            className={`bankroll${settleTone ? ` is-${settleTone}` : ''}${settled && isPlay ? ' is-pulse' : ''}`}
          >
            Bankroll ${game.bankroll.toFixed(0)}
            {settled && (
              <span className="bankroll-delta">{formatNet(settleNet)}</span>
            )}
          </div>
          {(winStreak > 0 || coldStreak > 0) && (
            <div
              className={`streak${winStreak > 0 ? ' is-hot' : ' is-cold'}`}
            >
              {winStreak > 0
                ? `Win streak ${winStreak}`
                : `Cold ${coldStreak}`}
            </div>
          )}
          <ShoeStrip
            round={shoeHint.round}
            decks={shoeHint.shoeDecks}
            cardsLeft={shoeHint.cardsLeft}
            cardsTotal={shoeHint.cardsTotal}
            decksRemaining={shoeHint.decksRemaining}
            shuffleNext={shoeHint.shuffleNext}
          />
          <div className={`message${settleTone ? ` is-${settleTone}` : ''}`}>
            {settled && settleTone
              ? `${resultTitle(settleTone)} ${formatNet(settleNet)}`
              : game.lastMessage}
          </div>
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
          {hintOpen && (
            <div className="hint-banner" role="status">
              <p>
                <strong>Next.</strong> {step.next}
              </p>
              {step.best && (
                <p>
                  <strong>Best play.</strong> {step.best}
                </p>
              )}
            </div>
          )}

          {phase === 'betting' && (
            <BettingBar
              bet={betInput}
              bankroll={game.bankroll}
              recommended={recAmount}
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
              showRecommended={!isPlay}
            />
          )}

          {phase === 'insurance' && (
            <div className="action-bar">
              <button
                type="button"
                className={`btn btn-action ${
                  adv?.action === 'insurance' && (trainer.autoHint || hintOpen)
                    ? 'is-hint'
                    : ''
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
                  adv?.action === 'noInsurance' && (trainer.autoHint || hintOpen)
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
              showHintButton={false}
              onHint={revealHint}
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

          <div className="action-bar">
            <button
              type="button"
              className={`btn btn-hint ${hintOpen ? 'active' : ''}`}
              data-tour="hint-btn"
              onClick={revealHint}
            >
              Hint
            </button>
          </div>
        </div>
      </main>

      {!isPlay && (
        <TrainerPanel tab={railTab} onTabChange={setRailTab} />
      )}

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
