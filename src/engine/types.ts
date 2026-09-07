export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'

export type Rank =
  | 'A'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K'

export type Card = {
  readonly suit: Suit
  readonly rank: Rank
  readonly id: string
}

export type PlayerAction =
  | 'hit'
  | 'stand'
  | 'double'
  | 'split'
  | 'surrender'

export type HandKind = 'hard' | 'soft' | 'pair'

export type PlayerHand = {
  cards: Card[]
  bet: number
  fromSplit: boolean
  fromSplitAces: boolean
  doubled: boolean
  stood: boolean
  surrendered: boolean
  done: boolean
}

export type DealerHand = {
  cards: Card[]
  holeHidden: boolean
}

export type RulesConfig = {
  decks: 1 | 2 | 4 | 6 | 8
  penetration: number
  hitSoft17: boolean
  blackjackPayout: '3:2' | '6:5'
  doubleAfterSplit: boolean
  lateSurrender: boolean
  maxSplitHands: number
  resplitAces: boolean
}

export type GamePhase =
  | { kind: 'betting' }
  | { kind: 'dealing' }
  | { kind: 'insurance' }
  | { kind: 'blackjackCheck' }
  | { kind: 'playerAction'; handIndex: number }
  | { kind: 'dealerAction' }
  | { kind: 'payout' }
  | { kind: 'handComplete' }
  | { kind: 'shuffling' }

export type HandResult = 'win' | 'loss' | 'push' | 'blackjack' | 'surrender'

export type HandPayout = {
  handIndex: number
  result: HandResult
  net: number
}

export type DecisionErrorKind = 'basic' | 'index' | null

export type TrainerSettings = {
  showRunningCount: boolean
  showTrueCount: boolean
  showDecksRemaining: boolean
  autoHint: boolean
  dealerSpeedMs: number
  baseUnit: number
  maxSpread: number
  kellyFraction: 1 | 0.5 | 0.25
  useKelly: boolean
  discardTrayMode: boolean
  distractionMode: boolean
  failOnLostCount: boolean
  decisionTimerSec: number
  decisionTimerEnabled: boolean
  countCheckEveryNHands: number
  soundEnabled: boolean
  autoNextHand: boolean
  /** Keep the Hi-Lo notes panel open while playing. */
  cheatSheetOpen: boolean
  /** Play hides the trainer rail. Train shows counts and drills. */
  tableMood: 'play' | 'train'
}

export type SessionStats = {
  handsPlayed: number
  wins: number
  losses: number
  pushes: number
  basicDecisions: number
  basicCorrect: number
  indexDecisions: number
  indexCorrect: number
  countPrompts: number
  countCorrect: number
}

export const VEGAS_DEFAULTS: RulesConfig = {
  decks: 6,
  penetration: 0.75,
  hitSoft17: false,
  blackjackPayout: '3:2',
  doubleAfterSplit: true,
  lateSurrender: true,
  maxSplitHands: 4,
  resplitAces: false,
}

export const DEFAULT_TRAINER: TrainerSettings = {
  showRunningCount: true,
  showTrueCount: true,
  showDecksRemaining: true,
  autoHint: false,
  dealerSpeedMs: 400,
  baseUnit: 10,
  maxSpread: 12,
  kellyFraction: 0.5,
  useKelly: false,
  discardTrayMode: false,
  distractionMode: false,
  failOnLostCount: false,
  decisionTimerSec: 5,
  decisionTimerEnabled: false,
  countCheckEveryNHands: 0,
  soundEnabled: true,
  autoNextHand: false,
  cheatSheetOpen: false,
  tableMood: 'play',
}
