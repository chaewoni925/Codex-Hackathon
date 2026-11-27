import type { HTMLAttributes, ReactNode } from 'react'
import styles from './Badge.module.css'
export type BadgeTone = 'neutral' | 'point' | 'warning' | 'danger'
export type BadgeProps = HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone; children: ReactNode }
export function Badge({ tone = 'neutral', className = '', ...props }: BadgeProps) {
  return <span className={`${styles.badge} ${styles[tone]} ${className}`} {...props} />
}
