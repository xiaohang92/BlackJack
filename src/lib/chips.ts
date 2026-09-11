export const CHIP_VALUES = [500, 100, 25, 5, 1] as const
export type ChipValue = (typeof CHIP_VALUES)[number]
export type ChipColumn = { value: ChipValue; count: number }

export function chipTone(value: number): 'white' | 'red' | 'green' | 'black' | 'purple' {
  if (value >= 500) return 'purple'
  if (value >= 100) return 'black'
  if (value >= 25) return 'green'
  if (value >= 5) return 'red'
  return 'white'
}

/** Same-color racks for the table. Caps how tall each denomination pile can get. */
export function groupChips(amount: number, maxPerDenom = 5): ChipColumn[] {
  const cols: ChipColumn[] = []
  let left = Math.max(0, Math.floor(amount))
  for (const value of CHIP_VALUES) {
    const count = Math.floor(left / value)
    if (count > 0) {
      cols.push({ value, count: Math.min(count, maxPerDenom) })
      left -= count * value
    }
  }
  return cols
}

export function breakdownChips(amount: number, maxVisual = 12): number[] {
  const out: number[] = []
  let left = Math.max(0, Math.floor(amount))
  for (const v of CHIP_VALUES) {
    while (left >= v && out.length < maxVisual) {
      out.push(v)
      left -= v
    }
  }
  return out
}
