import type { ReactNode } from 'react'
import { Button, type ButtonProps } from './Button'
import styles from './EmptyState.module.css'
export type EmptyStateProps = { message: string; actionLabel: string; onAction: ButtonProps['onClick']; buttonVariant?: ButtonProps['variant']; children?: never }
export function EmptyState({ message, actionLabel, onAction, buttonVariant }: EmptyStateProps) {
  return <div className={styles.empty}><p>{message}</p><Button variant={buttonVariant} onClick={onAction}>{actionLabel}</Button></div>
}
