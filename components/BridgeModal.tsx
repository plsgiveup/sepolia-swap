'use client'

import { useCallback, useEffect, useRef } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  /** Formatted USDC amount received, e.g. "223.62". Omitted while unknown. */
  amount?: string | null
}

export function BridgeModal({ open, onClose, amount }: Props) {
  const cta = useRef<HTMLAnchorElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const restoreTo = useRef<HTMLElement | null>(null)

  const close = useCallback(() => onClose(), [onClose])

  useEffect(() => {
    if (!open) return

    restoreTo.current = document.activeElement as HTMLElement | null
    cta.current?.focus()

    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        close()
        return
      }
      // Keep tabbing inside the dialog while it owns the screen.
      if (e.key !== 'Tab' || !panel.current) return
      const focusables = panel.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      )
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      restoreTo.current?.focus?.()
    }
  }, [open, close])

  if (!open) return null

  return (
    <div
      className="modal-scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <div
        className="modal"
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bridge-modal-title"
      >
        <button className="modal-x" onClick={close} aria-label="Close">
          ×
        </button>

        <p className="next-eyebrow">Swap complete</p>
        <h2 className="modal-title" id="bridge-modal-title">
          Take this USDC to Arc
        </h2>
        <p className="modal-copy">
          {amount ? `${amount} USDC is in your wallet on Sepolia. ` : ''}
          Bridge it over to start using it on Arc.
        </p>

        <a
          className="action bridge"
          ref={cta}
          href="https://limen.finance/bridge"
          target="_blank"
          rel="noreferrer"
          onClick={close}
        >
          Bridge to Arc →
        </a>

        <p className="modal-note">
          Pick Ethereum Sepolia as the source chain — the bridge defaults to Base Sepolia.
        </p>

        <button className="link-btn modal-later" onClick={close}>
          Not now
        </button>
      </div>
    </div>
  )
}
