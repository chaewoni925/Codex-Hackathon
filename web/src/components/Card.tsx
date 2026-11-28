import type { HTMLAttributes, ReactNode } from 'react'
import styles from './Card.module.css'
export type CardProps = HTMLAttributes<HTMLDivElement> & { selected?: boolean; children: ReactNode }
export function Card({ selected = false, className = '', ...props }: CardProps) {
  return <div className={`${styles.card} ${selected ? styles.selected : ''} ${className}`} {...props} />
}
