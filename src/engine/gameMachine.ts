import { basicStrategyAction } from './basicStrategy'
import { trueCountFloor } from './hiLo'
import { createPlayerHand, handTotal, isBlackjack } from './hand'
import { hiLoValue } from './hiLo'
import { indexAdvice } from './illustrious18'
import {
  blackjackMultiplier,
  dealerShouldHit,
  legalActions,
} from './rules'
import {
  cardsRemaining,
  createShoe,
  dealCard,
  reshuffleShoe,
  type Shoe,
} from './shoe'
import type {
  Card,
  DecisionErrorKind,
  DealerHand,
  GamePhase,
  HandPayout,
  PlayerAction,
  PlayerHand,
  RulesConfig,
} from './types'
import { VEGAS_DEFAULTS } from './types'

export type GameState = {
  rules: RulesConfig
  shoe: Shoe
  bankroll: number
  phase: GamePhase
  playerHands: PlayerHand[]
  activeHandIndex: number
  dealer: DealerHand
  insuranceOffered: boolean
  insuranceBet: number
  firstActionOnHand: boolean
  runningCount: number
  lastPayouts: HandPayout[]
  lastMessage: string
  handsSinceShuffle: number
  handsPlayed: number
  pendingReveal: Card[]
}

export type GameEvent =
  | { type: 'PLACE_BET'; amount: number }
  | { type: 'DEAL_STEP' }
  | { type: 'INSURANCE'; take: boolean }
  | { type: 'PLAYER_ACTION'; action: PlayerAction }
  | { type: 'DEALER_STEP' }
  | { type: 'RESOLVE_PAYOUT' }
  | { type: 'NEXT_HAND' }
  | { type: 'RESHUFFLE' }
  | { type: 'RESET'; bankroll?: number; rules?: RulesConfig }

function reveal(state: GameState, card: Card): GameState {
  return {
    ...state,
    runningCount: state.runningCount + hiLoValue(card.rank),
    pendingReveal: [...state.pendingReveal, card],
  }
}

export function createInitialState(
  rules: RulesConfig = VEGAS_DEFAULTS,
  bankroll = 1000,
  rng: () => number = Math.random,
): GameState {
  return {
    rules,
    shoe: createShoe(rules.decks, rules.penetration, rng),
    bankroll,
    phase: { kind: 'betting' },
    playerHands: [],
    activeHandIndex: 0,
    dealer: { cards: [], holeHidden: true },
    insuranceOffered: false,
    insuranceBet: 0,
    firstActionOnHand: true,
    runningCount: 0,
    lastPayouts: [],
    lastMessage: 'Place your bet',
    handsSinceShuffle: 0,
    handsPlayed: 0,
    pendingReveal: [],
  }
}

function dealOne(state: GameState): { state: GameState; card: Card } {
  const { shoe, card } = dealCard(state.shoe)
  return { state: { ...state, shoe }, card }
}

function startDeal(state: GameState, bet: number): GameState {
  if (bet <= 0 || bet > state.bankroll) {
    return { ...state, lastMessage: 'Invalid bet' }
  }
  let s: GameState = {
    ...state,
    bankroll: state.bankroll - bet,
    playerHands: [createPlayerHand(bet)],
    activeHandIndex: 0,
    dealer: { cards: [], holeHidden: true },
    insuranceOffered: false,
    insuranceBet: 0,
    firstActionOnHand: true,
    lastPayouts: [],
    pendingReveal: [],
    phase: { kind: 'dealing' },
    lastMessage: 'Dealing…',
  }

  // Player, dealer up, player, dealer hole
  const order: Array<'player' | 'dealer'> = [
    'player',
    'dealer',
    'player',
    'dealer',
  ]
  for (const dest of order) {
    const dealt = dealOne(s)
    s = dealt.state
    if (dest === 'player') {
      const hands = [...s.playerHands]
      hands[0] = {
        ...hands[0]!,
        cards: [...hands[0]!.cards, dealt.card],
      }
      s = reveal({ ...s, playerHands: hands }, dealt.card)
    } else {
      const cards = [...s.dealer.cards, dealt.card]
      const isHole = cards.length === 2
      s = {
        ...s,
        dealer: { cards, holeHidden: true },
      }
      if (!isHole) {
        s = reveal(s, dealt.card)
      }
    }
  }

  const up = s.dealer.cards[0]!
  if (up.rank === 'A') {
    return {
      ...s,
      phase: { kind: 'insurance' },
      insuranceOffered: true,
      lastMessage: 'Insurance?',
    }
  }
  return { ...s, phase: { kind: 'blackjackCheck' }, lastMessage: 'Checking…' }
}

function resolveInsurance(state: GameState, take: boolean): GameState {
  let s = state
  let insuranceBet = 0
  if (take) {
    insuranceBet = Math.floor(state.playerHands[0]!.bet / 2)
    if (insuranceBet > state.bankroll) {
      return { ...state, lastMessage: 'Not enough for insurance' }
    }
    s = { ...s, bankroll: state.bankroll - insuranceBet, insuranceBet }
  } else {
    s = { ...s, insuranceBet: 0 }
  }
  return { ...s, phase: { kind: 'blackjackCheck' }, lastMessage: 'Checking…' }
}

function settleInsuranceIfNeeded(state: GameState): GameState {
  if (state.insuranceBet <= 0) return state
  if (isBlackjack(state.dealer.cards)) {
    // Insurance pays 2:1 → stake returned + 2× win = 3× insurance wager
    return {
      ...state,
      bankroll: state.bankroll + state.insuranceBet * 3,
      insuranceBet: 0,
    }
  }
  return { ...state, insuranceBet: 0 }
}

function afterBlackjackCheck(state: GameState): GameState {
  // Reveal hole for BJ check count purposes only if dealer has BJ or player has BJ
  let s = state
  const hole = s.dealer.cards[1]!
  const playerBJ =
    s.playerHands.length === 1 &&
    !s.playerHands[0]!.fromSplit &&
    isBlackjack(s.playerHands[0]!.cards)
  const dealerBJ = isBlackjack(s.dealer.cards)

  if (playerBJ || dealerBJ) {
    s = reveal(
      {
        ...s,
        dealer: { ...s.dealer, holeHidden: false },
      },
      hole,
    )
    s = settleInsuranceIfNeeded(s)
    return { ...s, phase: { kind: 'payout' }, lastMessage: 'Blackjack!' }
  }

  // No BJ — insurance lost (already deducted); hole stays hidden
  return {
    ...s,
    insuranceBet: 0,
    phase: { kind: 'playerAction', handIndex: 0 },
    lastMessage: 'Your action',
  }
}

function markHandDone(hand: PlayerHand, patch: Partial<PlayerHand>): PlayerHand {
  return { ...hand, ...patch, done: true }
}

function advanceToNextHandOrDealer(state: GameState): GameState {
  let next = state.activeHandIndex + 1
  while (next < state.playerHands.length && state.playerHands[next]!.done) {
    next++
  }
  if (next < state.playerHands.length) {
    return {
      ...state,
      activeHandIndex: next,
      firstActionOnHand: true,
      phase: { kind: 'playerAction', handIndex: next },
      lastMessage: `Hand ${next + 1}`,
    }
  }
  return { ...state, phase: { kind: 'dealerAction' }, lastMessage: 'Dealer…' }
}

function applyPlayerAction(
  state: GameState,
  action: PlayerAction,
): GameState {
  const idx = state.activeHandIndex
  const hand = state.playerHands[idx]!
  const legal = legalActions({
    hand,
    rules: state.rules,
    handCount: state.playerHands.length,
    bankroll: state.bankroll,
    firstAction: state.firstActionOnHand,
  })
  if (!legal.includes(action)) {
    return { ...state, lastMessage: 'Illegal action' }
  }

  let s = state
  const hands = [...s.playerHands]

  switch (action) {
    case 'hit': {
      const dealt = dealOne(s)
      s = dealt.state
      const cards = [...hand.cards, dealt.card]
      s = reveal({ ...s }, dealt.card)
      const total = handTotal(cards)
      hands[idx] = {
        ...hand,
        cards,
        done: total.busted || total.total === 21,
        stood: total.total === 21,
      }
      s = {
        ...s,
        playerHands: hands,
        firstActionOnHand: false,
      }
      if (hands[idx]!.done) return advanceToNextHandOrDealer(s)
      return {
        ...s,
        phase: { kind: 'playerAction', handIndex: idx },
        lastMessage: 'Your action',
      }
    }
    case 'stand': {
      hands[idx] = markHandDone(hand, { stood: true })
      s = { ...s, playerHands: hands, firstActionOnHand: false }
      return advanceToNextHandOrDealer(s)
    }
    case 'double': {
      s = { ...s, bankroll: s.bankroll - hand.bet }
      const dealt = dealOne(s)
      s = dealt.state
      const cards = [...hand.cards, dealt.card]
      s = reveal(s, dealt.card)
      hands[idx] = markHandDone(
        { ...hand, bet: hand.bet * 2, doubled: true, cards },
        {},
      )
      s = { ...s, playerHands: hands, firstActionOnHand: false }
      return advanceToNextHandOrDealer(s)
    }
    case 'surrender': {
      hands[idx] = markHandDone(hand, { surrendered: true })
      s = { ...s, playerHands: hands, firstActionOnHand: false }
      return advanceToNextHandOrDealer(s)
    }
    case 'split': {
      const card0 = hand.cards[0]!
      const card1 = hand.cards[1]!
      s = { ...s, bankroll: s.bankroll - hand.bet }
      const isAces = card0.rank === 'A'
      const left = createPlayerHand(hand.bet, [card0])
      left.fromSplit = true
      left.fromSplitAces = isAces || hand.fromSplitAces
      const right = createPlayerHand(hand.bet, [card1])
      right.fromSplit = true
      right.fromSplitAces = isAces || hand.fromSplitAces

      // Deal one card to each
      let d1 = dealOne(s)
      s = d1.state
      left.cards = [...left.cards, d1.card]
      s = reveal(s, d1.card)

      let d2 = dealOne(s)
      s = d2.state
      right.cards = [...right.cards, d2.card]
      s = reveal(s, d2.card)

      if (isAces) {
        left.done = true
        left.stood = true
        right.done = true
        right.stood = true
      }

      hands.splice(idx, 1, left, right)
      s = {
        ...s,
        playerHands: hands,
        activeHandIndex: idx,
        firstActionOnHand: true,
      }

      if (left.done) {
        return advanceToNextHandOrDealer({
          ...s,
          activeHandIndex: idx,
        })
      }
      return {
        ...s,
        phase: { kind: 'playerAction', handIndex: idx },
        lastMessage: 'Your action',
      }
    }
    default: {
      const _exhaustive: never = action
      return _exhaustive
    }
  }
}

function dealerStep(state: GameState): GameState {
  let s = state
  if (s.dealer.holeHidden) {
    const hole = s.dealer.cards[1]!
    s = reveal(
      { ...s, dealer: { ...s.dealer, holeHidden: false } },
      hole,
    )
    const allDone = s.playerHands.every(
      (h) => h.surrendered || handTotal(h.cards).busted,
    )
    if (allDone) {
      return { ...s, phase: { kind: 'payout' }, lastMessage: 'Settling…' }
    }
    return s
  }

  if (dealerShouldHit(s.dealer.cards, s.rules.hitSoft17)) {
    const dealt = dealOne(s)
    s = dealt.state
    const cards = [...s.dealer.cards, dealt.card]
    s = reveal({ ...s, dealer: { cards, holeHidden: false } }, dealt.card)
    return s
  }

  return { ...s, phase: { kind: 'payout' }, lastMessage: 'Settling…' }
}

function resolvePayouts(state: GameState): GameState {
  const dealerTotal = handTotal(state.dealer.cards)
  const dealerBJ = isBlackjack(state.dealer.cards)
  const payouts: HandPayout[] = []
  let bankroll = state.bankroll

  state.playerHands.forEach((hand, handIndex) => {
    if (hand.surrendered) {
      const net = -hand.bet / 2
      // half bet returned (full bet was already taken)
      bankroll += hand.bet / 2
      payouts.push({ handIndex, result: 'surrender', net })
      return
    }

    const pt = handTotal(hand.cards)
    if (pt.busted) {
      payouts.push({ handIndex, result: 'loss', net: -hand.bet })
      return
    }

    const playerBJ =
      !hand.fromSplit && isBlackjack(hand.cards) && state.playerHands.length === 1

    if (playerBJ && dealerBJ) {
      bankroll += hand.bet
      payouts.push({ handIndex, result: 'push', net: 0 })
      return
    }
    if (playerBJ && !dealerBJ) {
      const win = hand.bet * blackjackMultiplier(state.rules.blackjackPayout)
      bankroll += hand.bet + win
      payouts.push({ handIndex, result: 'blackjack', net: win })
      return
    }
    if (dealerBJ && !playerBJ) {
      payouts.push({ handIndex, result: 'loss', net: -hand.bet })
      return
    }

    if (dealerTotal.busted) {
      bankroll += hand.bet * 2
      payouts.push({ handIndex, result: 'win', net: hand.bet })
      return
    }

    if (pt.total > dealerTotal.total) {
      bankroll += hand.bet * 2
      payouts.push({ handIndex, result: 'win', net: hand.bet })
    } else if (pt.total < dealerTotal.total) {
      payouts.push({ handIndex, result: 'loss', net: -hand.bet })
    } else {
      bankroll += hand.bet
      payouts.push({ handIndex, result: 'push', net: 0 })
    }
  })

  const msg = payouts.map((p) => p.result).join(', ')
  return {
    ...state,
    bankroll,
    lastPayouts: payouts,
    handsPlayed: state.handsPlayed + 1,
    handsSinceShuffle: state.handsSinceShuffle + 1,
    phase: { kind: 'handComplete' },
    lastMessage: msg,
  }
}

/** Hands into the current shoe. Resets after the cut card. */
export function shoeRound(state: GameState): number {
  if (state.phase.kind === 'handComplete') {
    return Math.max(1, state.handsSinceShuffle)
  }
  return state.handsSinceShuffle + 1
}

export function getTrueCountTrunc(state: GameState): number {
  return trueCountFloor(state.runningCount, cardsRemaining(state.shoe))
}

export function getAdvice(state: GameState): {
  action: PlayerAction | 'insurance' | 'noInsurance'
  isIndex: boolean
  indexName?: string
} | null {
  const tc = getTrueCountTrunc(state)
  if (state.phase.kind === 'insurance') {
    return indexAdvice({
      hand: state.playerHands[0]!,
      dealerUp: state.dealer.cards[0]!,
      rules: state.rules,
      legal: [],
      trueCountTrunc: tc,
      canOfferSurrender: false,
      forInsurance: true,
    })
  }
  if (state.phase.kind !== 'playerAction') return null
  const hand = state.playerHands[state.activeHandIndex]!
  const legal = legalActions({
    hand,
    rules: state.rules,
    handCount: state.playerHands.length,
    bankroll: state.bankroll,
    firstAction: state.firstActionOnHand,
  })
  return indexAdvice({
    hand,
    dealerUp: state.dealer.cards[0]!,
    rules: state.rules,
    legal,
    trueCountTrunc: tc,
    canOfferSurrender: state.firstActionOnHand,
  })
}

export function getBasicAdvice(state: GameState): PlayerAction | null {
  if (state.phase.kind !== 'playerAction') return null
  const hand = state.playerHands[state.activeHandIndex]!
  const legal = legalActions({
    hand,
    rules: state.rules,
    handCount: state.playerHands.length,
    bankroll: state.bankroll,
    firstAction: state.firstActionOnHand,
  })
  return basicStrategyAction({
    hand,
    dealerUp: state.dealer.cards[0]!,
    rules: state.rules,
    legal,
    canOfferSurrender: state.firstActionOnHand,
  })
}

export function reduce(
  state: GameState,
  event: GameEvent,
  rng: () => number = Math.random,
): GameState {
  switch (event.type) {
    case 'RESET':
      return createInitialState(
        event.rules ?? state.rules,
        event.bankroll ?? state.bankroll,
        rng,
      )
    case 'PLACE_BET': {
      if (state.phase.kind !== 'betting') return state
      if (state.shoe.needsShuffle) {
        const shoe = reshuffleShoe(state.shoe, rng)
        return startDeal(
          {
            ...state,
            shoe,
            runningCount: 0,
            handsSinceShuffle: 0,
            lastMessage: 'Shuffled',
          },
          event.amount,
        )
      }
      return startDeal(state, event.amount)
    }
    case 'INSURANCE': {
      if (state.phase.kind !== 'insurance') return state
      return resolveInsurance(state, event.take)
    }
    case 'DEAL_STEP': {
      if (state.phase.kind === 'blackjackCheck') {
        return afterBlackjackCheck(state)
      }
      return state
    }
    case 'PLAYER_ACTION': {
      if (state.phase.kind !== 'playerAction') return state
      return applyPlayerAction(state, event.action)
    }
    case 'DEALER_STEP': {
      if (state.phase.kind !== 'dealerAction') return state
      return dealerStep(state)
    }
    case 'RESOLVE_PAYOUT': {
      if (state.phase.kind !== 'payout') return state
      return resolvePayouts(state)
    }
    case 'NEXT_HAND': {
      if (state.phase.kind !== 'handComplete') return state
      return {
        ...state,
        phase: { kind: 'betting' },
        playerHands: [],
        dealer: { cards: [], holeHidden: true },
        lastMessage: state.shoe.needsShuffle
          ? 'Shuffle pending — place bet'
          : 'Place your bet',
        pendingReveal: [],
      }
    }
    case 'RESHUFFLE': {
      const shoe = reshuffleShoe(state.shoe, rng)
      return {
        ...state,
        shoe,
        runningCount: 0,
        handsSinceShuffle: 0,
        lastMessage: 'Shoe shuffled',
      }
    }
    default: {
      const _exhaustive: never = event
      return _exhaustive
    }
  }
}

export type ActionGrade = {
  errorKind: DecisionErrorKind
  optimal: PlayerAction
  isIndex: boolean
}

export { legalActions }
