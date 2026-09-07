export type TourStep = {
  id: string
  title: string
  body: string
  /** Matches data-tour attribute on a target element. Omit for centered intro/outro. */
  target?: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    body: 'Play is the table. Train opens the count rail. Notes and Hint stay available either way.',
  },
  {
    id: 'mood',
    title: 'Play or Train',
    body: 'Play fills the felt. Train adds the count rail, Rec bet, and drills.',
    target: 'mood-tabs',
    placement: 'bottom',
  },
  {
    id: 'table',
    title: 'The table',
    body: 'Dealer on top, you on the bottom. Bankroll and messages sit under the felt.',
    target: 'felt',
    placement: 'bottom',
  },
  {
    id: 'bet',
    title: 'Place a bet',
    body: 'Chips or type an amount, then Deal. In Train, Rec suggests a count-based size.',
    target: 'betting',
    placement: 'top',
  },
  {
    id: 'actions',
    title: 'Play the hand',
    body: 'Hit, Stand, Double, Split, Surrender. Hint tells you the next step and the best play.',
    target: 'controls',
    placement: 'top',
  },
  {
    id: 'count',
    title: 'Keep the count',
    body: 'Hi-Lo: 2–6 +1 · 7–9 0 · 10–A −1. True Count = Running ÷ decks left. Switch to Train to see RC/TC live.',
    target: 'count-panel',
    placement: 'bottom',
  },
  {
    id: 'notes',
    title: 'Notes while you play',
    body: 'Turn on Notes for a Hi-Lo hint sheet. It follows this shoe: decks left drop as cards come out. Play as usual.',
    target: 'notes-btn',
    placement: 'bottom',
  },
  {
    id: 'verify',
    title: 'Check yourself',
    body: 'Check count stays folded away. Open it only if you want a quiz against the real RC/TC.',
    target: 'verify-count',
    placement: 'bottom',
  },
  {
    id: 'trainer',
    title: 'Options',
    body: 'Toggle Auto-Hint, counts, Kelly, timer, and realism tools from this Options tab.',
    target: 'trainer-toggles',
    placement: 'bottom',
  },
  {
    id: 'settings',
    title: 'Table rules',
    body: 'Change decks, penetration, S17/H17, payout, DAS, surrender — Vegas defaults apply.',
    target: 'settings-btn',
    placement: 'bottom',
  },
  {
    id: 'sim',
    title: 'Simulation',
    body: 'Run thousands of hands to chart bankroll and estimate Risk of Ruin.',
    target: 'sim-btn',
    placement: 'bottom',
  },
  {
    id: 'done',
    title: "You're ready",
    body: 'Deal a hand in Play for the table feel. Flip to Train when you want the count rail.',
  },
]
