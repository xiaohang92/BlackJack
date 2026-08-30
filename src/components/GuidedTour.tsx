import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { TOUR_STEPS } from '../tour/steps'
import type { RailTab } from './TrainerPanel'

type Rect = { top: number; left: number; width: number; height: number }

type Props = {
  open: boolean
  onClose: () => void
  onStepTarget?: (target: string | undefined) => void
}

const MARGIN = 10

function getTargetRect(tourId: string): Rect | null {
  const el = document.querySelector(`[data-tour="${tourId}"]`)
  if (!(el instanceof HTMLElement)) return null
  const r = el.getBoundingClientRect()
  if (r.width < 2 && r.height < 2) return null
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

/** Always dock tip at bottom — never scroll the page during the tour. */
function dockStyle(vw: number, vh: number): CSSProperties {
  return {
    position: 'fixed',
    left: MARGIN,
    right: MARGIN,
    bottom: MARGIN,
    width: 'auto',
    maxWidth: Math.min(520, vw - MARGIN * 2),
    marginLeft: 'auto',
    marginRight: 'auto',
    maxHeight: Math.min(vh * 0.34, 220),
    transform: 'none',
  }
}

export function tabForTourTarget(target: string | undefined): RailTab | null {
  if (!target) return null
  if (target === 'count-panel' || target === 'verify-count') return 'count'
  if (target === 'trainer-toggles') return 'options'
  return null
}

export function GuidedTour({ open, onClose, onStepTarget }: Props) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [cardStyle, setCardStyle] = useState<CSSProperties>({})
  const nextBtnRef = useRef<HTMLButtonElement>(null)

  const current = TOUR_STEPS[step]!
  const isLast = step >= TOUR_STEPS.length - 1

  useLayoutEffect(() => {
    if (!open) return
    setStep(0)
  }, [open])

  useLayoutEffect(() => {
    if (!open) return
    onStepTarget?.(current.target)

    const layout = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      setCardStyle(dockStyle(vw, vh))
      // Measure after tab switch has painted
      requestAnimationFrame(() => {
        if (!current.target) {
          setRect(null)
          return
        }
        setRect(getTargetRect(current.target))
      })
    }

    layout()
    const t = window.setTimeout(layout, 50)
    window.addEventListener('resize', layout)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('resize', layout)
    }
  }, [open, step, current.target, onStepTarget])

  useEffect(() => {
    if (!open) return
    nextBtnRef.current?.focus()
  }, [open, step])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault()
        if (isLast) onClose()
        else setStep((s) => s + 1)
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setStep((s) => Math.max(0, s - 1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, isLast, onClose])

  if (!open) return null

  const pad = 6
  const highlight = rect
    ? {
        top: Math.max(4, rect.top - pad),
        left: Math.max(4, rect.left - pad),
        width: Math.min(rect.width + pad * 2, window.innerWidth - 8),
        height: Math.min(rect.height + pad * 2, window.innerHeight - 8),
      }
    : null

  return (
    <div className="tour-root" role="presentation">
      <div className="tour-scrim" aria-hidden="true" />
      {highlight && (
        <div
          className="tour-spotlight"
          style={{
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
          }}
          aria-hidden="true"
        />
      )}

      <div
        className="tour-card tour-card-dock"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        style={cardStyle}
      >
        <div className="tour-progress">
          Step {step + 1} of {TOUR_STEPS.length}
        </div>
        <h2 id="tour-title">{current.title}</h2>
        <p>{current.body}</p>
        <div className="tour-actions">
          <button type="button" className="btn" onClick={onClose}>
            Skip
          </button>
          {step > 0 && (
            <button
              type="button"
              className="btn"
              onClick={() => setStep((s) => s - 1)}
            >
              Back
            </button>
          )}
          <button
            ref={nextBtnRef}
            type="button"
            className="btn btn-primary"
            onClick={() => {
              if (isLast) onClose()
              else setStep((s) => s + 1)
            }}
          >
            {isLast ? 'Start playing' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
