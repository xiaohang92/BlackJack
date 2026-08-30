# Hi-Lo Blackjack Trainer

Practice card counting (Hi-Lo), basic strategy, Illustrious 18 / Fab 4 deviations, bet sizing (spread & Kelly), and Monte Carlo bankroll simulation.

## Scripts

```bash
npm install
npm run dev      # play at http://localhost:5173
npm test         # engine unit tests
npm run build    # production build
```

## Features

- Configurable Vegas-standard rules (decks, penetration, S17/H17, 3:2 vs 6:5, DAS, surrender, resplit aces)
- Full hand state machine with insurance, splits, doubles, surrender
- Live running/true count, count verification quizzes, strategy hints & index-error tagging
- Trainer panel analytics (W/L/P, BS accuracy, counting accuracy, live EV)
- Casino realism: discard tray, distractions, decision timer
- Simulation mode with bankroll chart and risk-of-ruin estimate
