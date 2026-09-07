/** Opening four: player, dealer up, player, hole. Later cards stay even/odd so delays never collide. */

export function playerDealIndex(i: number): number {
  return 2 * i
}

export function dealerDealIndex(i: number): number {
  return 2 * i + 1
}
