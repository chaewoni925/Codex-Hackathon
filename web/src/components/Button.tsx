import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import styles from './Button.module.css'
import { Spinner } from './Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  loading?: boolean
  children: ReactNode
  ref?: Ref<HTMLButtonElement>
}

export function Button({ variant = 'primary', loading = false, disabled, children, className = '', ref, ...props }: ButtonProps) {
  return <button ref={ref} className={`${styles.button} ${styles[variant]} ${className}`} disabled={disabled || loading} aria-busy={loading} {...props}>
    {loading && <Spinner label="불러오는 중" />}<span>{children}</span>
  </button>
}
