import { Button } from './Button'
import styles from './ErrorBox.module.css'
export type ErrorBoxProps = { message: string; onRetry: () => void; retryLabel?: string }
export function ErrorBox({ message, onRetry, retryLabel = '다시 시도' }: ErrorBoxProps) {
  return <div className={styles.box} role="alert"><p>{message}</p><Button variant="secondary" onClick={onRetry}>{retryLabel}</Button></div>
}
