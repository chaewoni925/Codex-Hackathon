import { useEffect, useRef, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './Button'
import type { RouteStep } from '../types'
import styles from './AlertModal.module.css'
import { guestCopy, type GuestLanguage } from '../i18n/guest'

export type AlertAudience = 'owner' | 'guest'
export type AlertModalProps = { spot?: Pick<RouteStep, 'object' | 'where'>; audience: AlertAudience; onClose: () => void; language?: GuestLanguage }

export function AlertModal({ spot, audience, onClose, language = 'ko' }: AlertModalProps) {
  const sheetRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent | globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !sheetRef.current) return
      const focusable = Array.from(sheetRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [onClose])

  const detail = spot ? `${spot.object} · ${spot.where}` : ''
  const copy = guestCopy[language]
  return createPortal(
    <div className={styles.backdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section ref={sheetRef} className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="alert-title">
        <div className={styles.grabber} />
        <h2 id="alert-title">{copy.alertTitle}</h2>
        {detail && <p className={styles.detail}>{detail}</p>}
        <ol>
          <li><span>1</span><p>{copy.dontTouch}</p></li>
          <li><span>2</span><p>{copy.photograph}</p></li>
          <li><span>3</span><p>{copy.reportPolice}</p></li>
          <li><span>4</span><p>{audience === 'owner' ? (language === 'ko' ? '손님을 받지 말고 공간 이용을 멈추세요' : 'Stop receiving guests and stop using the space') : copy.guestStop}</p></li>
        </ol>
        <div className={styles.actions}><a className={styles.call} href="tel:112">{copy.callPolice}</a><Button ref={closeRef} variant="secondary" onClick={onClose}>{copy.close}</Button></div>
      </section>
    </div>,
    document.body,
  )
}
