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
    body: 'Quick tour of the trainer. Everything stays on one screen — no scrolling needed.',
  },
  {
    id: 'table',
    title: 'The table',
    body: 'Casino felt with a shoe, betting circle, and overlapping cards. Watch each card fly from the shoe and flip the hole card.',
    target: 'felt',
    placement: 'bottom',
  },
  {
    id: 'bet',
    title: 'Place a bet',
    body: 'Drop chips on the circle, Undo/Clear, or Rebet the last wager. Space deals. Keys 1–5 add chips.',
    target: 'betting',
    placement: 'top',
  },
  {
    id: 'actions',
    title: 'Play the hand',
    body: 'Hit, Stand, Double, Split, Surrender — or keys H S D P R. Hint marks the best play. Doubles land sideways.',
    target: 'controls',
    placement: 'top',
  },
  {
    id: 'count',
    title: 'Keep the count',
    body: 'Hi-Lo: 2–6 +1 · 7–9 0 · 10–A −1. True Count = Running ÷ decks left.',
    target: 'count-panel',
    placement: 'bottom',
  },
  {
    id: 'verify',
    title: 'Check yourself',
    body: 'Verify Count quizzes you with numbers hidden. Accuracy is tracked in Stats.',
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
    body: 'Deal a hand and watch the count. Replay anytime from How to play.',
  },
]
