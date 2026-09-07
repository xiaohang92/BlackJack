import { describe, expect, it } from 'vitest'
import {
  formatNet,
  netTotal,
  overallTone,
  resultTitle,
} from './resultView'
import type { HandPayout } from './types'

function pay(result: HandPayout['result'], net: number, handIndex = 0): HandPayout {
  return { handIndex, result, net }
}

describe('resultView', () => {
  it('sums net and titles a single win', () => {
    const payouts = [pay('win', 25)]
    expect(netTotal(payouts)).toBe(25)
    expect(overallTone(payouts)).toBe('win')
    expect(resultTitle('win')).toBe('You win')
    expect(formatNet(25)).toBe('+$25')
    expect(formatNet(-10)).toBe('−$10')
  })

  it('uses net for mixed splits', () => {
    const payouts = [pay('win', 10, 0), pay('loss', -10, 1)]
    expect(overallTone(payouts)).toBe('mixed')
    expect(netTotal(payouts)).toBe(0)
  })
})
