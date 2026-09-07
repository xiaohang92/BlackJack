import type { HandPayout, HandResult } from './types'

export type ResultTone = HandResult | 'mixed'

export function netTotal(payouts: HandPayout[]): number {
  return payouts.reduce((sum, p) => sum + p.net, 0)
}

export function overallTone(payouts: HandPayout[]): ResultTone {
  if (payouts.length === 0) return 'push'
  const first = payouts[0]
  if (first === undefined) return 'push'
  if (payouts.length === 1) return first.result
  const unique = new Set(payouts.map((p) => p.result))
  if (unique.size === 1) return first.result
  const net = netTotal(payouts)
  if (net > 0) return 'win'
  if (net < 0) return 'loss'
  return 'mixed'
}

export function resultTitle(tone: ResultTone): string {
  switch (tone) {
    case 'win':
      return 'You win'
    case 'loss':
      return 'You lose'
    case 'blackjack':
      return 'Blackjack'
    case 'push':
      return 'Push'
    case 'surrender':
      return 'Surrender'
    case 'mixed':
      return 'Split'
    default: {
      const _exhaustive: never = tone
      return _exhaustive
    }
  }
}

export function formatNet(n: number): string {
  if (n > 0) return `+$${n.toFixed(0)}`
  if (n < 0) return `−$${Math.abs(n).toFixed(0)}`
  return '$0'
}

export function resultLabel(result: HandResult): string {
  switch (result) {
    case 'win':
      return 'Win'
    case 'loss':
      return 'Lose'
    case 'blackjack':
      return 'BJ'
    case 'push':
      return 'Push'
    case 'surrender':
      return 'Sur'
    default: {
      const _exhaustive: never = result
      return _exhaustive
    }
  }
}
