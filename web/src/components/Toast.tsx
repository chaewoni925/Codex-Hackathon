import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import styles from './Toast.module.css'
type ToastContextValue = (message: string) => void
const ToastContext = createContext<ToastContextValue | null>(null)
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('')
  const toast = useCallback((nextMessage: string) => setMessage(nextMessage), [])
  useEffect(() => {
    if (!message) return
    const timeout = window.setTimeout(() => setMessage(''), 3000)
    return () => window.clearTimeout(timeout)
  }, [message])
  return <ToastContext.Provider value={toast}>{children}{message && <div className={styles.toast} role="status">{message}</div>}</ToastContext.Provider>
}
export function useToast() {
  const toast = useContext(ToastContext)
  if (!toast) throw new Error('useToast는 ToastProvider 안에서 사용해야 합니다.')
  return toast
}
