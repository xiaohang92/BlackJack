import { describe, expect, it } from 'vitest'
import { describeNextStep } from './nextStep'
import { createInitialState } from './gameMachine'

describe('describeNextStep', () => {
  it('tells you to deal while betting', () => {
    const game = createInitialState()
    const step = describeNextStep({
      phase: 'betting',
      advice: null,
      recBet: 20,
      game,
    })
    expect(step.next).toMatch(/Deal/)
    expect(step.best).toMatch(/\$20/)
  })

  it('names the best player action', () => {
    const game = createInitialState()
    const step = describeNextStep({
      phase: 'playerAction',
      advice: { action: 'stand', isIndex: true, indexName: 'I18 16v10 TC≥+1' },
      recBet: 10,
      game,
    })
    expect(step.best).toMatch(/Stand/)
    expect(step.best).toMatch(/I18/)
  })
})
