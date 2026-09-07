let ctx: AudioContext | null = null
let enabled = true

export function setSoundEnabled(on: boolean) {
  enabled = on
}

function ac(): AudioContext | null {
  if (!enabled || typeof window === 'undefined') return null
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  if (!ctx) ctx = new Ctx()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType,
  gain: number,
  at = 0,
) {
  const c = ac()
  if (!c) return
  const t = c.currentTime + at
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.connect(g)
  g.connect(c.destination)
  osc.start(t)
  osc.stop(t + duration + 0.03)
}

export function unlockAudio() {
  ac()
}

export function playDeal(delay = 0) {
  tone(290, 0.08, 'triangle', 0.07, delay)
  tone(165, 0.1, 'sine', 0.045, delay)
}

export function playDealSequence(n: number, gap = 0.22) {
  for (let i = 0; i < n; i++) playDeal(i * gap)
}

export function playFlip() {
  tone(440, 0.11, 'triangle', 0.09)
  tone(220, 0.16, 'sine', 0.055, 0.05)
}

export function playChip() {
  tone(920, 0.045, 'square', 0.035)
  tone(1380, 0.035, 'square', 0.025, 0.028)
}

export function playWin() {
  ;[523, 659, 784].forEach((f, i) => tone(f, 0.16, 'triangle', 0.07, i * 0.09))
}

export function playBlackjack() {
  ;[523, 659, 784, 1047].forEach((f, i) =>
    tone(f, 0.18, 'triangle', 0.08, i * 0.1),
  )
}

export function playLose() {
  tone(196, 0.22, 'sawtooth', 0.04)
  tone(147, 0.28, 'sine', 0.05, 0.07)
}

export function playPush() {
  tone(349, 0.12, 'triangle', 0.05)
  tone(349, 0.12, 'triangle', 0.035, 0.14)
}

export function playShuffle() {
  for (let i = 0; i < 10; i++) {
    tone(180 + (i % 5) * 70, 0.045, 'square', 0.025, i * 0.048)
  }
}
