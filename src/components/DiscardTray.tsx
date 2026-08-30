type Props = {
  ratio: number
  label?: string
}

export function DiscardTray({ ratio, label }: Props) {
  const pct = Math.min(100, Math.max(0, ratio * 100))
  return (
    <div>
      {label && (
        <div className="zone-label" style={{ textAlign: 'center' }}>
          {label}
        </div>
      )}
      <div className="discard-tray" title="Estimate remaining decks from discards">
        <div className="fill" style={{ height: `${pct}%` }} />
      </div>
    </div>
  )
}
