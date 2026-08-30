/** Edge ≈ baseline house edge + 0.5% per true count. */
export function playerEdge(trueCount: number): number {
  return -0.005 + trueCount * 0.005
}

export function formatEdgePercent(edge: number): string {
  const pct = edge * 100
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(2)}%`
}
